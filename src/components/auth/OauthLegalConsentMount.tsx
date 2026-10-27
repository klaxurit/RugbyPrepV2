import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'
import { supabase } from '../../services/supabase/client'
import { newsletterPreferencePatch } from '../../services/auth/accountUpgradePrompts'
import {
  clearPendingOauthConsent,
  isGoogleAuthUser,
  readPendingOauthConsent,
  shouldPromptOauthLegalConsent,
  type OauthLegalConsentStatus,
} from '../../services/auth/oauthLegalConsent'
import {
  fetchMedicalConsentAcceptedAt,
  persistOauthLegalConsent,
} from '../../services/auth/persistOauthLegalConsent'
import { useOverlayPermission } from '../../hooks/useOverlayPermission'
import { OauthLegalConsentSheet } from './OauthLegalConsentSheet'

function metadataHasMedicalConsent(metadata: Record<string, unknown> | undefined): boolean {
  return typeof metadata?.medical_consent_accepted_at === 'string'
    && metadata.medical_consent_accepted_at.length > 0
}

export function OauthLegalConsentMount() {
  const { authState } = useAuth()
  const { profile, updateProfile } = useProfile()
  const location = useLocation()
  const [resolved, setResolved] = useState<{
    userId: string
    status: OauthLegalConsentStatus
  } | null>(null)
  const [saving, setSaving] = useState(false)

  const authenticated = authState.status === 'authenticated' && Boolean(authState.user)
  const userId = authenticated ? authState.user?.id : undefined
  const lang = profile.preferredLanguage === 'en' ? 'en' : 'fr'
  const consentStatus: OauthLegalConsentStatus =
    userId && resolved?.userId === userId ? resolved.status : 'loading'

  useEffect(() => {
    if (!authenticated || !userId) return

    let cancelled = false

    const resolveConsent = async () => {
      const existing = await fetchMedicalConsentAcceptedAt(userId)
      if (cancelled) return

      if (existing) {
        clearPendingOauthConsent()
        setResolved({ userId, status: 'present' })
        return
      }

      const { data } = await supabase.auth.getUser()
      if (cancelled) return

      const authUser = data.user
      if (metadataHasMedicalConsent(authUser?.user_metadata as Record<string, unknown> | undefined)) {
        clearPendingOauthConsent()
        setResolved({ userId, status: 'present' })
        return
      }

      const pending = readPendingOauthConsent()
      if (pending) {
        await persistOauthLegalConsent({
          userId,
          medicalConsentAcceptedAt: pending.medicalConsentAcceptedAt,
          newsletterOptIn: pending.newsletterOptIn,
        })
        if (cancelled) return
        clearPendingOauthConsent()
        updateProfile({
          adultPlayEligibilityApproved: true,
          ...newsletterPreferencePatch(pending.newsletterOptIn, 'signup', pending.medicalConsentAcceptedAt),
        })
        setResolved({ userId, status: 'present' })
        return
      }

      if (!authUser || !isGoogleAuthUser(authUser)) {
        setResolved({ userId, status: 'present' })
        return
      }

      setResolved({ userId, status: 'missing' })
    }

    void resolveConsent()
    return () => {
      cancelled = true
    }
  }, [authenticated, updateProfile, userId])

  const showNatural = authenticated && shouldPromptOauthLegalConsent({
    pathname: location.pathname,
    consentStatus,
  })
  const show = useOverlayPermission('legal_consent', showNatural)

  const handleSubmit = useCallback(async () => {
    if (!userId) return
    setSaving(true)
    const acceptedAt = new Date().toISOString()
    await persistOauthLegalConsent({
      userId,
      medicalConsentAcceptedAt: acceptedAt,
    })
    updateProfile({ adultPlayEligibilityApproved: true })
    setResolved({ userId, status: 'present' })
    setSaving(false)
  }, [updateProfile, userId])

  if (!authenticated) return null

  return (
    <OauthLegalConsentSheet
      open={show}
      lang={lang}
      isLoading={saving}
      onSubmit={handleSubmit}
    />
  )
}
