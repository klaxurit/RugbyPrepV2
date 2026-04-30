import { useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { useCalendar } from '../hooks/useCalendar'
import { useHistory } from '../hooks/useHistory'
import { useACWR } from '../hooks/useACWR'
import { useProgramChangeNotice } from '../hooks/useProgramChangeNotice'
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

  const { notice, acknowledge, postpone } = useProgramChangeNotice({
    profile: authState.status === 'authenticated' ? profile : null,
    calendarEvents: visibleEvents,
    acwrZone: acwr.zone,
    today,
  })

  if (authState.status !== 'authenticated') return null
  if (SUPPRESS_PATHS.has(location.pathname)) return null
  if (!notice) return null

  return <ProgramChangeModal notice={notice} onAcknowledge={acknowledge} onPostpone={postpone} />
}
