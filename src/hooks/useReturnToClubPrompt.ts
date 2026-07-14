import { useCallback, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'
import { useProfile, isOnboardingComplete } from './useProfile'
import { useCalendar } from './useCalendar'
import { useHistory } from './useHistory'
import { useACWR } from './useACWR'
import { useHintVisibility } from './useHintVisibility'
import { useFoundingOfferEligibility } from './useFoundingOfferEligibility'
import { useProgramEvolutionSheet } from './useProgramEvolutionSheet'
import { buildAthletePlanningInputs } from '../services/annualPlanning/buildAthletePlanningInputs'
import { detectAnnualPlanningContext } from '../services/season/detectAnnualPlanningContext'
import { hasPendingOffseasonMatchDecision } from '../services/season/hasPendingOffseasonMatchDecision'
import {
  RETURN_TO_CLUB_PROMPT_HINT_ID,
  shouldPromptReturnToClub,
} from '../services/season/shouldPromptReturnToClub'
import { userScopedKey } from '../services/storage/userScopedStorage'
import { getToday } from '../services/ui/debugDateOverride'
import type { Lang } from '../i18n/appLabels'

const ONBOARDING_COMPLETED_STORAGE_BASE = 'rugbyprep.onboarding.completedAt'
const ONBOARDING_GRACE_DAYS = 7

function readOnboardingCompletedAt(userId: string | null): string | undefined {
  try {
    return localStorage.getItem(userScopedKey(ONBOARDING_COMPLETED_STORAGE_BASE, userId)) ?? undefined
  } catch {
    return undefined
  }
}

function addDays(ymd: string, days: number): string {
  const d = new Date(`${ymd}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function useReturnToClubPrompt() {
  const { authState } = useAuth()
  const userId = authState.status === 'authenticated' ? authState.user?.id ?? null : null
  const { profile, updateProfile } = useProfile()
  const { visibleEvents } = useCalendar()
  const { logs } = useHistory()
  const acwr = useACWR(logs, visibleEvents)
  const location = useLocation()
  const today = getToday()
  const { eligible: foundingOfferOpen } = useFoundingOfferEligibility()
  const { isProgramEvolutionOpen } = useProgramEvolutionSheet()
  const [saving, setSaving] = useState(false)

  const { visible: hintVisible, dismiss: dismissForWeek, loading: hintLoading } = useHintVisibility(
    RETURN_TO_CLUB_PROMPT_HINT_ID,
    { cooldownDays: 7 },
  )

  const planningContext = useMemo(() => {
    if (!profile.position) return null
    try {
      const { inputs } = buildAthletePlanningInputs({
        profile,
        events: visibleEvents ?? [],
        logs,
        today,
        fatigue: null,
        acwrZone: acwr.hasSufficientData ? acwr.zone : null,
      })
      return detectAnnualPlanningContext(inputs)
    } catch {
      return null
    }
  }, [profile, visibleEvents, logs, today, acwr.hasSufficientData, acwr.zone])

  const onboardingComplete = userId ? isOnboardingComplete(userId) : false
  const onboardingCompletedAt = readOnboardingCompletedAt(userId)
  const inOnboardingGracePeriod = Boolean(
    onboardingCompletedAt && today <= addDays(onboardingCompletedAt, ONBOARDING_GRACE_DAYS),
  )

  const hasPendingOffseasonMatch = useMemo(
    () => hasPendingOffseasonMatchDecision(profile, visibleEvents ?? [], today),
    [profile, visibleEvents, today],
  )

  const needsPrompt = shouldPromptReturnToClub({
    cycle: planningContext?.cycle,
    hasReturnDate: Boolean(profile.planningAnchors?.returnToTeamTrainingAt),
    onboardingComplete,
    inOnboardingGracePeriod,
    hasPendingOffseasonMatch,
    pathname: location.pathname,
  })

  const open =
    authState.status === 'authenticated' &&
    needsPrompt &&
    hintVisible &&
    !hintLoading &&
    !foundingOfferOpen &&
    !isProgramEvolutionOpen

  const lang: Lang = profile.preferredLanguage === 'en' ? 'en' : 'fr'
  const needsClub = !profile.clubCode

  const save = useCallback(
    (payload: { returnDate: string; clubName?: string; clubCode?: string }) => {
      setSaving(true)
      try {
        const patch: Parameters<typeof updateProfile>[0] = {
          planningAnchors: {
            ...profile.planningAnchors,
            returnToTeamTrainingAt: payload.returnDate,
          },
          seasonMode: 'pre_season',
        }
        if (payload.clubCode) {
          patch.clubCode = payload.clubCode
          patch.clubName = payload.clubName
        }
        updateProfile(patch)
        if (payload.clubCode) {
          void import('../services/club/syncClubMembership').then(({ syncMyClubMembership }) =>
            syncMyClubMembership(payload.clubCode),
          )
        }
      } finally {
        setSaving(false)
      }
    },
    [profile.planningAnchors, updateProfile],
  )

  const remindLater = useCallback(() => {
    dismissForWeek()
  }, [dismissForWeek])

  return {
    open,
    lang,
    today,
    needsClub,
    initialClubName: profile.clubName ?? '',
    initialClubCode: profile.clubCode,
    saving,
    save,
    remindLater,
  }
}
