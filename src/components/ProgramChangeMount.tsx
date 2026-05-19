import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { useCalendar } from '../hooks/useCalendar'
import { useHistory } from '../hooks/useHistory'
import { useACWR } from '../hooks/useACWR'
import { useProgramChangeNotice } from '../hooks/useProgramChangeNotice'
import { useProgramEvolutionSheet } from '../contexts/ProgramEvolutionSheetContext'
import { getToday } from '../services/ui/debugDateOverride'
import { ProgramChangeModal } from './ProgramChangeModal'

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
  '/delete-account',
])

/**
 * Global mount for the program-change modal.
 *
 * Les notices `match` utilisent la même {@link ProgramEvolutionSheet} que l’ajout
 * de match / sync FFR (bottom sheet, swipe, fond) — pas la {@link ProgramChangeModal}
 * (carte centrée + padding, pas de dismiss backdrop).
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
  const delegatedMatchNoticeRef = useRef<string | null>(null)

  const { notice, acknowledge, postpone } = useProgramChangeNotice({
    profile: authState.status === 'authenticated' ? profile : null,
    calendarEvents: visibleEvents,
    acwrZone: acwr.zone,
    today,
  })

  useEffect(() => {
    if (!notice || notice.type !== 'match') {
      delegatedMatchNoticeRef.current = null
      return
    }
    if (delegatedMatchNoticeRef.current === notice.id) return
    delegatedMatchNoticeRef.current = notice.id
    const fromId = /^match:(\d{4}-\d{2}-\d{2})$/.exec(notice.id)?.[1]
    openProgramEvolution({
      matchDateISO: fromId,
      programNoticeId: notice.id,
    })
  }, [notice, openProgramEvolution])

  if (authState.status !== 'authenticated') return null
  if (SUPPRESS_PATHS.has(location.pathname)) return null
  if (!notice) return null

  if (notice.type === 'match') return null

  return <ProgramChangeModal notice={notice} onAcknowledge={acknowledge} onPostpone={postpone} />
}
