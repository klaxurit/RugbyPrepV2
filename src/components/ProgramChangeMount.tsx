import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { useCalendar } from '../hooks/useCalendar'
import { useHistory } from '../hooks/useHistory'
import { useACWR } from '../hooks/useACWR'
import { useProgramChangeNotice } from '../hooks/useProgramChangeNotice'
import { useProgramEvolutionSheet } from '../hooks/useProgramEvolutionSheet'
import { getToday } from '../services/ui/debugDateOverride'
import { programModalLabel } from '../i18n/programSurfaces'

const SUPPRESS_PATHS = new Set([
  '/onboarding',
  '/auth/login',
  '/auth/signup',
  '/auth/callback',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/login',
  '/signup',
  '/landing',
  '/legal',
  '/privacy',
  '/delete-account',
])

/**
 * Global mount for program-change notices.
 *
 * Toutes les notices (match, phase, cycle, ACWR) passent par la même
 * {@link ProgramEvolutionSheet} / {@link BottomSheet} que l’ajout de match
 * ou la fin de séance — swipe, backdrop, bouton fermer, collée en bas.
 *
 * Suppressed during onboarding and on auth/legal pages — those have their
 * own focus and a blocking modal would derail them. Otherwise rides on top
 * of every authenticated route.
 */
export function ProgramChangeMount() {
  const { authState } = useAuth()
  const { profile } = useProfile()
  const { visibleEvents } = useCalendar()
  const { logs } = useHistory()
  const acwr = useACWR(logs, visibleEvents)
  const location = useLocation()
  const today = getToday()
  const { openProgramEvolution } = useProgramEvolutionSheet()
  const delegatedNoticeRef = useRef<string | null>(null)

  const { notice, postpone } = useProgramChangeNotice({
    profile: authState.status === 'authenticated' ? profile : null,
    calendarEvents: visibleEvents,
    acwrZone: acwr.zone,
    today,
  })

  const lang = profile.preferredLanguage === 'en' ? 'en' : 'fr'

  useEffect(() => {
    if (authState.status !== 'authenticated') return
    if (SUPPRESS_PATHS.has(location.pathname)) return

    if (!notice) {
      delegatedNoticeRef.current = null
      return
    }
    if (delegatedNoticeRef.current === notice.id) return
    delegatedNoticeRef.current = notice.id

    if (notice.type === 'match') {
      const fromId = /^match:(\d{4}-\d{2}-\d{2})$/.exec(notice.id)?.[1]
      openProgramEvolution({
        matchDateISO: fromId,
        programNoticeId: notice.id,
      })
      return
    }

    openProgramEvolution({
      programNoticeId: notice.id,
      sectionTitle: notice.title,
      summary: notice.summary,
      bullets: notice.bullets,
      secondaryCtaLabel: notice.canPostponeNow
        ? programModalLabel('cta_postpone', lang)
        : undefined,
      onSecondaryPress: notice.canPostponeNow ? postpone : undefined,
      secondaryHint:
        !notice.canPostponeNow && notice.postponable
          ? programModalLabel('already_postponed', lang)
          : undefined,
    })
  }, [
    authState.status,
    location.pathname,
    notice,
    openProgramEvolution,
    postpone,
    lang,
  ])

  return null
}
