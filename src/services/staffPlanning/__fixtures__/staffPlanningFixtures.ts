/**
 * Données démo sandbox staff — même date de référence : 2025-03-18 (semaine ISO avec match le 22/03).
 */
import type { StaffPlanningAthleteRecord } from '../staffPlanningRepository'
import type { AthletePlanningInputs } from '../../../types/annualPlanning'
import type { ResolveMotherSessionsForWeekOptions } from '../../motherSession/resolveMotherSessionsForWeek'
import type { CalendarEvent, UserProfile } from '../../../types/training'
import { DEFAULT_PROFILE } from '../../../hooks/useProfile'

export const SANDBOX_CLUB_ID = 'sandbox-club-rugbyforge'
export const SANDBOX_SQUAD_ID = 'seniors-1'

/** Référence démo partagée avec la page sandbox. */
export const SANDBOX_REFERENCE_DATE = '2025-03-18'

const FIRST_IN_SEASON = '2025-03-15'
const MATCH_SAME_WEEK = '2025-03-22'
const FIRST_LATE_SEASON = '2025-06-01'

function match(id: string, date: string): CalendarEvent {
  return { id, date, type: 'match', opponent: `Adversaire ${date}` }
}

function profile(p: Partial<UserProfile>): UserProfile {
  return {
    ...DEFAULT_PROFILE,
    ageBand: 'adult',
    seasonMode: 'in_season',
    equipment: ['barbell', 'dumbbell', 'bench', 'pullup_bar'],
    injuries: [],
    healthConsentStatus: 'not_required',
    healthDataRetentionState: 'active',
    healthConsentAuditTrail: [],
    ...p,
  }
}

/** Champs optionnels portés par le repo mémoire (cast côté hook). */
export type StaffPlanningAthleteSeed = StaffPlanningAthleteRecord & {
  planningAnchors?: AthletePlanningInputs['planningAnchors']
  motherSessionResolverOptions?: ResolveMotherSessionsForWeekOptions
  displayName?: string
}

/**
 * 6 joueurs : cycles variés pour la même `today` (voir SANDBOX_REFERENCE_DATE).
 */
export const SANDBOX_ROSTER: StaffPlanningAthleteSeed[] = [
  {
    athleteId: 'sandbox-athlete-off-1',
    clubId: SANDBOX_CLUB_ID,
    squadId: SANDBOX_SQUAD_ID,
    displayName: 'Lucas Martin — hors-saison (recovery)',
    profile: profile({
      rugbyPosition: 'FRONT_ROW',
      weeklySessions: 2,
      seasonMode: 'off_season',
    }),
    events: [],
    logs: [],
    fatigue: 'OK',
    planningAnchors: {
      firstMatchDateOverride: FIRST_LATE_SEASON,
      offSeasonStartAt: '2025-03-03',
      manualOffSeasonWeekOverride: 1,
    },
  },
  {
    athleteId: 'sandbox-athlete-pre-1',
    clubId: SANDBOX_CLUB_ID,
    squadId: SANDBOX_SQUAD_ID,
    displayName: 'Thomas Bernard — pré-saison',
    profile: profile({
      rugbyPosition: 'BACK_THREE',
      weeklySessions: 3,
      seasonMode: 'pre_season',
    }),
    events: [match('m-pre', '2025-06-15')],
    logs: [],
    fatigue: 'OK',
    planningAnchors: {
      firstMatchDateOverride: '2025-06-15',
      manualPreSeasonWeekOverride: 5,
    },
  },
  {
    athleteId: 'sandbox-athlete-in-mw',
    clubId: SANDBOX_CLUB_ID,
    squadId: SANDBOX_SQUAD_ID,
    displayName: 'Hugo Petit — en saison · semaine de match',
    profile: profile({
      rugbyPosition: 'FRONT_ROW',
      weeklySessions: 3,
      trainingLevel: 'performance',
    }),
    events: [match('m1', FIRST_IN_SEASON), match('m2', MATCH_SAME_WEEK)],
    logs: [
      {
        id: 'l1',
        dateISO: '2025-03-11T18:00:00.000Z',
        week: 'W1',
        sessionType: 'LOWER',
        fatigue: 'OK',
        rpe: 7,
        durationMin: 55,
      },
    ],
    fatigue: 'OK',
    acwrZone: 'optimal',
  },
  {
    athleteId: 'sandbox-athlete-in-nomw',
    clubId: SANDBOX_CLUB_ID,
    squadId: SANDBOX_SQUAD_ID,
    displayName: 'Nathan Roy — en saison · sans match · fatigue haute',
    profile: profile({
      rugbyPosition: 'BACK_THREE',
      weeklySessions: 3,
    }),
    events: [match('m-a', FIRST_IN_SEASON), match('m-b', '2025-04-12')],
    logs: [],
    fatigue: 'FATIGUE',
    acwrZone: 'caution',
  },
  {
    athleteId: 'sandbox-athlete-po',
    clubId: SANDBOX_CLUB_ID,
    squadId: SANDBOX_SQUAD_ID,
    displayName: 'Maxime Leroy — playoffs (taper)',
    profile: profile({
      rugbyPosition: 'FRONT_ROW',
      weeklySessions: 3,
      trainingLevel: 'performance',
    }),
    events: [match('m-po', FIRST_IN_SEASON)],
    logs: [],
    fatigue: 'OK',
    planningAnchors: { manualPlayoffs: true },
  },
  {
    athleteId: 'sandbox-athlete-risk',
    clubId: SANDBOX_CLUB_ID,
    squadId: SANDBOX_SQUAD_ID,
    displayName: 'Alex Durand — dataset incomplet + faible adhérence',
    profile: profile({
      rugbyPosition: 'SECOND_ROW',
      weeklySessions: 3,
    }),
    events: [match('m-r', FIRST_IN_SEASON), match('m-r2', MATCH_SAME_WEEK)],
    logs: [],
    fatigue: 'OK',
    motherSessionResolverOptions: { sessionsById: {} },
  },
]
