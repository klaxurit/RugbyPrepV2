import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Lang } from '../i18n/appLabels'
import type { ACWRZone } from './useACWR'
import type { CalendarEvent, UserProfile } from '../types/training'
import type { ProgramChangeNotice, VisibleProgramChangeNotice } from '../types/programChange'
import { detectProgramChange } from '../services/program/detectProgramChange'
import {
  PROGRAM_NOTICE_STORAGE_KEY,
  PROGRAM_NOTICE_UPDATED_EVENT,
  readProgramNoticePersisted,
  writeProgramNoticePersisted,
  type PersistedProgramNoticeState,
} from '../services/program/programNoticeAck'
import { hasPendingOffseasonMatchDecision } from '../services/season/hasPendingOffseasonMatchDecision'
import { resolvePositionGroup } from '../services/annualPlanning/buildAthletePlanningInputs'
import {
  FATIGUE_LOAD_DECISION_UPDATED_EVENT,
  readFatigueLoadDecisionForDay,
} from '../services/program/fatigueLoadChoice'

const PREVIEW_KEY = 'rf.programNotice.preview.v1'

/**
 * Dev-only preview hook: read a synthetic notice from localStorage so the
 * modal can be exercised without driving the real detector. Set via:
 *   localStorage.setItem('rf.programNotice.preview.v1', 'cycle' | 'phase' | 'deload' | 'acwr-caution' | 'acwr-critical' | 'acwr-danger' | 'match')
 * then reload. Si le sheet ne pop pas : clear les acks preview —
 *   localStorage.removeItem('rf.programNotice.v1')
 * Clear preview : localStorage.removeItem('rf.programNotice.preview.v1').
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
      case 'deload':
        return {
          id: 'preview:deload',
          type: 'phase',
          severity: 'info',
          title: 'Semaine de décharge',
          summary:
            'Cette semaine est la 4ᵉ du cycle 3:1 — volume réduit (~40 %), intensité maintenue.',
          bullets: [
            '≈ −40 % de volume (moins de blocs / tours)',
            'Intensité gardée — qualité d’exécution, pas séance « vide »',
            'Capitalise sur les 3 semaines de charge précédentes',
          ],
          postponable: true,
          effectiveDate: '2099-01-01',
        }
      case 'acwr-caution':
        return {
          id: 'preview:acwr-caution',
          type: 'acwr',
          severity: 'info',
          title: 'Charge à surveiller',
          summary:
            'Tu es en zone de vigilance (ACWR 1.38). Qualité avant quantité cette semaine.',
          bullets: [
            'Recommandé : alléger le volume (−20–30 %) sans changer les séances',
            'Ou garder le programme et t’autoréguler',
            'Pas de séance en plus tant que le ratio redescend',
          ],
          postponable: false,
          effectiveDate: '2099-01-01',
          acwrRatio: 1.38,
          fatigueLoadZone: 'caution',
          weeklyFrequency: 3,
          defaultFatigueLoadChoice: 'lighten_volume',
        }
      case 'acwr-critical':
        return {
          id: 'preview:acwr-critical',
          type: 'acwr',
          severity: 'critical',
          title: 'Charge d\'entraînement très élevée',
          summary:
            'Ton ratio aigu/chronique est en zone critique (ACWR 2.15). Choisis comment protéger ta semaine.',
          bullets: [
            'Défaut recommandé : retirer 1 séance (souvent le Primer)',
            'Ou alléger le volume (−20–30 %) en gardant Lower / Upper / Primer',
            'Tu peux aussi gérer toi-même — avec un risque plus élevé',
          ],
          postponable: false,
          effectiveDate: '2099-01-01',
          acwrRatio: 2.15,
          fatigueLoadZone: 'critical',
          weeklyFrequency: 3,
          defaultFatigueLoadChoice: 'drop_session',
        }
      case 'acwr-danger':
        return {
          id: 'preview:acwr-danger',
          type: 'acwr',
          severity: 'warning',
          title: 'Charge d\'entraînement élevée',
          summary:
            'Ton ratio aigu/chronique est en zone à risque (ACWR 1.62). Adapte ta semaine — à toi de choisir.',
          bullets: [
            'Recommandé : alléger les séances (−20–30 % de volume)',
            'Ou retirer 1 séance (Primer) si tu es à 3× / semaine',
            'Ou gérer toi-même (RPE, sommeil, courbatures)',
          ],
          postponable: false,
          effectiveDate: '2099-01-01',
          acwrRatio: 1.62,
          fatigueLoadZone: 'danger',
          weeklyFrequency: 3,
          defaultFatigueLoadChoice: 'lighten_volume',
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

const EMPTY: PersistedProgramNoticeState = { acknowledged: {}, postponed: {} }
const POSTPONE_DAYS = 7

/**
 * Vrai quand l'utilisateur est en off-season ET a un match futur
 * non hidden dans son calendrier qu'il n'a NI accepté
 * (`offseasonMatchResumeAckEventId`) NI déféré (`activeDeferral`).
 *
 * Quand c'est vrai, c'est le `SeasonTransitionBanner` (variant
 * `match_detected_in_offseason`, monté sur `/home`) qui doit
 * gérer la décision : il a 3 boutons (Oui/Non/Pas mon équipe) et
 * écrit le bon état dans `seasonTransitionState`. Faire pop-up le
 * `ProgramEvolutionSheet` en parallèle = 2 surfaces concurrentes pour
 * la même décision, et son "Plus tard" ne pose pas d'override de
 * cycle → l'utilisateur refuse mais le programme bascule quand même.
 */
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
  acwrRatio?: number | null
  hasSufficientAcwrData?: boolean
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
  const { profile, calendarEvents, acwrZone, acwrRatio, hasSufficientAcwrData, today } = args
  const [persisted, setPersisted] = useState<PersistedProgramNoticeState>(() =>
    typeof window === 'undefined' ? EMPTY : readProgramNoticePersisted(),
  )
  const [decisionTick, setDecisionTick] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onStorage = (event: StorageEvent) => {
      if (event.key === PROGRAM_NOTICE_STORAGE_KEY) setPersisted(readProgramNoticePersisted())
    }
    const onLocalBump = () => setPersisted(readProgramNoticePersisted())
    const onDecision = () => setDecisionTick((n) => n + 1)
    window.addEventListener('storage', onStorage)
    window.addEventListener(PROGRAM_NOTICE_UPDATED_EVENT, onLocalBump)
    window.addEventListener(FATIGUE_LOAD_DECISION_UPDATED_EVENT, onDecision)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(PROGRAM_NOTICE_UPDATED_EVENT, onLocalBump)
      window.removeEventListener(FATIGUE_LOAD_DECISION_UPDATED_EVENT, onDecision)
    }
  }, [])

  const detected = useMemo(() => {
    const preview = readPreviewNotice()
    if (preview) return preview
    if (!profile) return null
    if (!profile.weeklySessions || !profile.position) return null
    try {
      const lang = (profile.preferredLanguage === 'en' ? 'en' : 'fr') satisfies Lang
      const weeklyFrequency = (profile.weeklySessions === 2 ||
      profile.weeklySessions === 3 ||
      profile.weeklySessions === 4
        ? profile.weeklySessions
        : 3) as 2 | 3 | 4
      const positionGroup = resolvePositionGroup(profile, [])
      // `decisionTick` force le re-read localStorage après choix / undo.
      const alreadyChoseLoad =
        decisionTick >= 0 && Boolean(readFatigueLoadDecisionForDay(today))
      return detectProgramChange({
        today,
        weeklyFrequency,
        positionGroup,
        planningAnchors: profile.planningAnchors,
        trainingBaseline: profile.trainingBaseline,
        acwrZone: alreadyChoseLoad ? null : acwrZone,
        acwrRatio: alreadyChoseLoad ? null : acwrRatio,
        hasSufficientAcwrData,
        calendarEvents,
        lang,
      })
    } catch {
      return null
    }
  }, [profile, calendarEvents, acwrZone, acwrRatio, hasSufficientAcwrData, today, decisionTick])

  const visible = useMemo<VisibleProgramChangeNotice | null>(() => {
    if (!detected) return null

    if (persisted.acknowledged[detected.id]) return null

    // Dédup avec SeasonTransitionBanner (HomePage) : si l'utilisateur est
    // en off-season ET un match futur non ack/déféré existe, le banner
    // `match_detected_in_offseason` est la surface canonique (3 actions
    // claires + écrit `activeDeferral` côté profil pour que le moteur
    // respecte le "Non, pas maintenant"). On supprime ici les notices
    // `cycle` et `match` pour ne pas empiler 2 popups sur le même
    // événement et pour ne pas exposer un "Plus tard" qui ne pose pas
    // d'override de cycle.
    if (
      profile &&
      (detected.type === 'cycle' || detected.type === 'match') &&
      hasPendingOffseasonMatchDecision(profile, calendarEvents, today)
    ) {
      return null
    }

    const postponedAt = persisted.postponed[detected.id]
    if (postponedAt) {
      const elapsed = daysBetween(postponedAt, today)
      if (elapsed < POSTPONE_DAYS) return null
      // Postpone has expired — re-surface but disable the postpone button.
      return { ...detected, canPostponeNow: false }
    }

    return { ...detected, canPostponeNow: detected.postponable }
  }, [detected, persisted, today, profile, calendarEvents])

  const acknowledge = useCallback(() => {
    if (!visible) return
    setPersisted((prev) => {
      const next: PersistedProgramNoticeState = {
        acknowledged: { ...prev.acknowledged, [visible.id]: today },
        postponed: { ...prev.postponed },
      }
      delete next.postponed[visible.id]
      writeProgramNoticePersisted(next, { noticeId: visible.id })
      return next
    })
  }, [visible, today])

  const postpone = useCallback(() => {
    if (!visible || !visible.canPostponeNow) return
    setPersisted((prev) => {
      const next: PersistedProgramNoticeState = {
        acknowledged: { ...prev.acknowledged },
        postponed: { ...prev.postponed, [visible.id]: today },
      }
      writeProgramNoticePersisted(next, {})
      return next
    })
  }, [visible, today])

  return { notice: visible, acknowledge, postpone }
}
