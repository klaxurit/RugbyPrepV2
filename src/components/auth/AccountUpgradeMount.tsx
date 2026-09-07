import { useCallback, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'
import { supabase } from '../../services/supabase/client'
import { clearPasswordNeedsUpgrade } from '../../services/auth/clearPasswordNeedsUpgrade'
import {
  newsletterPreferencePatch,
  shouldPromptNewsletterOptIn,
  shouldPromptPasswordUpgrade,
} from '../../services/auth/accountUpgradePrompts'
import { resolvePasswordNeedsUpgrade } from '../../services/auth/passwordUpgradeGate'
import { PasswordUpgradeSheet } from './PasswordUpgradeSheet'
import { NewsletterOptInSheet } from './NewsletterOptInSheet'

function resolvePasswordUpdateError(message: string): string {
  const normalized = message.toLowerCase()
  if (normalized.includes('same password')) {
    return 'Choisis un mot de passe différent de l’ancien.'
  }
  if (normalized.includes('leaked') || normalized.includes('pwned') || normalized.includes('data breach')) {
    return 'Ce mot de passe apparaît dans une fuite de données. Choisis-en un autre.'
  }
  return 'Impossible de mettre à jour le mot de passe pour le moment.'
}

export function AccountUpgradeMount() {
  const { authState } = useAuth()
  const { profile, updateProfile } = useProfile()
  const location = useLocation()
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [newsletterSaving, setNewsletterSaving] = useState(false)

  const authenticated = authState.status === 'authenticated' && Boolean(authState.user)
  const userId = authenticated ? authState.user?.id : undefined
  const lang = profile.preferredLanguage === 'en' ? 'en' : 'fr'

  const passwordNeedsUpgrade = resolvePasswordNeedsUpgrade(profile.passwordNeedsUpgrade)
  const showPassword = authenticated && shouldPromptPasswordUpgrade({
    pathname: location.pathname,
    passwordNeedsUpgrade,
  })
  const showNewsletter = authenticated && shouldPromptNewsletterOptIn({
    pathname: location.pathname,
    passwordNeedsUpgrade,
    newsletterOptIn: profile.newsletterOptIn,
  })

  const handlePasswordSubmit = useCallback(async (password: string) => {
    if (!userId) return
    setPasswordSaving(true)
    setPasswordError(null)

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setPasswordError(resolvePasswordUpdateError(error.message))
      setPasswordSaving(false)
      return
    }

    await clearPasswordNeedsUpgrade(userId)
    updateProfile({ passwordNeedsUpgrade: false })
    setPasswordSaving(false)
  }, [updateProfile, userId])

  const handleNewsletterChoice = useCallback(async (optedIn: boolean) => {
    setNewsletterSaving(true)
    updateProfile(newsletterPreferencePatch(optedIn, 'in_app'))
    setNewsletterSaving(false)
  }, [updateProfile])

  if (!authenticated) return null

  return (
    <>
      <PasswordUpgradeSheet
        open={showPassword}
        lang={lang}
        isLoading={passwordSaving}
        error={passwordError}
        onSubmit={handlePasswordSubmit}
      />
      <NewsletterOptInSheet
        open={!showPassword && showNewsletter}
        lang={lang}
        isLoading={newsletterSaving}
        onAccept={() => handleNewsletterChoice(true)}
        onDecline={() => handleNewsletterChoice(false)}
      />
    </>
  )
}
