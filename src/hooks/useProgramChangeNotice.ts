import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ACWRZone } from './useACWR'
import type { CalendarEvent, UserProfile } from '../types/training'
import type { ProgramChangeNotice, VisibleProgramChangeNotice } from '../types/programChange'
import { detectProgramChange } from '../services/program/detectProgramChange'

const PREVIEW_KEY = 'rf.programNotice.preview.v1'

/**
 * Dev-only preview hook: read a synthetic notice from localStorage so the
 * modal can be exercised without driving the real detector. Set via:
 *   localStorage.setItem('rf.programNotice.preview.v1', 'cycle' | 'phase' | 'acwr-critical' | 'acwr-danger' | 'match')
 * and reload. Clear with `localStorage.removeItem('rf.programNotice.preview.v1')`.
 */
function readPreviewNotice(): ProgramChangeNotice | null {
  if (typeof window === 'undefined') return null
  if (!import.meta.env.DEV) return null
  try {
    const flavor = window.localStorage.getItem(PREVIEW_KEY)
    switch (flavor) {
      case 'cycle':
        return {
          id: 'preview:cycle',
          type: 'cycle',
          severity: 'warning',
          title: 'Tu démarres la pré-saison lundi',
          summary: 'Ton programme change de cycle : inter-saison → pré-saison.',
          bullets: [
            'Travail de force et de puissance plus intense',
            'Volume légèrement réduit, charge plus lourde (4–5 reps)',
            'Première semaine = adaptation progressive',
          ],
          postponable: true,
          effectiveDate: '2099-01-01',
        }
      case 'phase':
        return {
          id: 'preview:phase',
          type: 'phase',
          severity: 'info',
          title: 'Nouvelle phase d\'inter-saison',
          summary: 'Tu passes de la phase Récupération à Transition.',
          bullets: [
            'Réintroduction progressive du tonnage',
            'Mouvements composés à charge modérée',
            'Préparation pour l\'hypertrophie',
          ],
          postponable: true,
          effectiveDate: '2099-01-01',
        }
      case 'acwr-critical':
        return {
          id: 'preview:acwr-critical',
          type: 'acwr',
          severity: 'critical',
          title: 'Charge d\'entraînement très élevée',
          summary: 'Ton ratio aigu/chronique est en zone critique. Le programme va réduire la charge cette semaine.',
          bullets: [
            '1 séance maximum cette semaine',
            'Privilégie mobilité et sommeil',
            'Reprise progressive la semaine prochaine',
          ],
          postponable: false,
          effectiveDate: '2099-01-01',
        }
      case 'acwr-danger':
        return {
          id: 'preview:acwr-danger',
          type: 'acwr',
          severity: 'warning',
          title: 'Charge d\'entraînement élevée',
          summary: 'Ton ratio aigu/chronique est en zone à risque. On retire une séance cette semaine.',
          bullets: [
            '−1 séance par rapport au programme prévu',
            'Garde de l\'intensité mais réduit le volume',
            'Surveille ton sommeil et tes courbatures',
          ],
          postponable: false,
          effectiveDate: '2099-01-01',
        }
      case 'match':
        return {
          id: 'preview:match',
          type: 'match',
          severity: 'info',
          title: 'Semaine de match',
          summary: 'Match prévu samedi — la semaine est calée pour arriver frais.',
          bullets: [
            'Charge réduite à mesure qu\'on approche du match',
            'Dernière séance au moins 48h avant',
            'Mobilité et activation ajoutées',
          ],
          postponable: false,
          effectiveDate: '2099-01-01',
        }
      default:
        return null
    }
  } catch {
    return null
  }
}

const STORAGE_KEY = 'rf.programNotice.v1'
const POSTPONE_DAYS = 7

interface PersistedState {
  acknowledged: Record<string, string>
  postponed: Record<string, string>
}

const EMPTY: PersistedState = { acknowledged: {}, postponed: {} }

function readPersisted(): PersistedState {
  if (typeof window === 'undefined') return EMPTY
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as Partial<PersistedState>
    return {
      acknowledged: { ...(parsed.acknowledged ?? {}) },
      postponed: { ...(parsed.postponed ?? {}) },
    }
  } catch {
    return EMPTY
  }
}

function writePersisted(state: PersistedState): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore quota
  }
}

function daysBetween(a: string, b: string): number {
  const parse = (iso: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
    if (!m) return null
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12).getTime()
  }
  const ta = parse(a)
  const tb = parse(b)
  if (ta == null || tb == null) return 0
  return Math.round((tb - ta) / (24 * 60 * 60 * 1000))
}

interface UseProgramChangeNoticeArgs {
  profile: UserProfile | null
  calendarEvents: CalendarEvent[]
  acwrZone: ACWRZone | null
  today: string
}

export interface UseProgramChangeNoticeResult {
  notice: VisibleProgramChangeNotice | null
  acknowledge: () => void
  postpone: () => void
}

/**
 * Surface the highest-priority pending program-change notice for the given
 * profile/calendar/ACWR state, gated by the user's prior acknowledge/postpone
 * actions stored in localStorage.
 *
 * Postpone semantics: hides the notice for 7 days. When it re-surfaces after
 * that, the postpone option is gone (user must acknowledge to dismiss).
 */
export function useProgramChangeNotice(args: UseProgramChangeNoticeArgs): UseProgramChangeNoticeResult {
  const { profile, calendarEvents, acwrZone, today } = args
  const [persisted, setPersisted] = useState<PersistedState>(() => readPersisted())

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setPersisted(readPersisted())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const detected = useMemo(() => {
    const preview = readPreviewNotice()
    if (preview) return preview
    if (!profile) return null
    if (!profile.weeklySessions || !profile.position) return null
    try {
      return detectProgramChange({
        today,
        weeklyFrequency: (profile.weeklySessions ?? 3) as 2 | 3 | 4,
        positionGroup: 'back_three',
        planningAnchors: profile.planningAnchors,
        trainingBaseline: profile.trainingBaseline,
        acwrZone,
        calendarEvents,
      })
    } catch {
      return null
    }
  }, [profile, calendarEvents, acwrZone, today])

  const visible = useMemo<VisibleProgramChangeNotice | null>(() => {
    if (!detected) return null

    if (persisted.acknowledged[detected.id]) return null

    const postponedAt = persisted.postponed[detected.id]
    if (postponedAt) {
      const elapsed = daysBetween(postponedAt, today)
      if (elapsed < POSTPONE_DAYS) return null
      // Postpone has expired — re-surface but disable the postpone button.
      return { ...detected, canPostponeNow: false }
    }

    return { ...detected, canPostponeNow: detected.postponable }
  }, [detected, persisted, today])

  const acknowledge = useCallback(() => {
    if (!visible) return
    setPersisted((prev) => {
      const next: PersistedState = {
        acknowledged: { ...prev.acknowledged, [visible.id]: today },
        postponed: { ...prev.postponed },
      }
      delete next.postponed[visible.id]
      writePersisted(next)
      return next
    })
  }, [visible, today])

  const postpone = useCallback(() => {
    if (!visible || !visible.canPostponeNow) return
    setPersisted((prev) => {
      const next: PersistedState = {
        acknowledged: { ...prev.acknowledged },
        postponed: { ...prev.postponed, [visible.id]: today },
      }
      writePersisted(next)
      return next
    })
  }, [visible, today])

  return { notice: visible, acknowledge, postpone }
}
