/**
 * Données de démo pour tester les graphiques et le suivi de performance.
 * Usage : appeler seedDemoData() puis recharger la page.
 *
 * Note : Si tu es connecté, les données Supabase remplaceront les données démo
 * au chargement. Pour tester le mode démo, déconnecte-toi avant de charger.
 */

import type { BlockLog, SessionLog } from '../types/training'
import type { PhysicalTest } from '../types/athleticTesting'

export const DEMO_MODE_KEY = 'rugbyprep.demo.active'

const BLOCK_LOGS_KEY = 'rugbyprep.blocklogs.v1'
const HISTORY_KEY = 'rugbyprep.history.v1'
const ATHLETIC_TESTS_KEY = 'rugbyprep.athletictests.v1'

export const isDemoModeActive = (): boolean =>
  typeof window !== 'undefined' && window.localStorage.getItem(DEMO_MODE_KEY) === '1'

const daysAgo = (n: number): string => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

/** Blocs loggés avec progression simulée (bench, squat, etc.) */
export const FAKE_BLOCK_LOGS: BlockLog[] = [
  {
    id: 'demo-1',
    dateISO: `${daysAgo(2)}T10:00:00.000Z`,
    week: 'W1',
    sessionType: 'UPPER',
    blockId: 'BLK_FORCE_BENCH_01',
    blockName: 'Force bench',
    entries: [
      { exerciseId: 'push_horizontal__bench_press__barbell', loadKg: 60, reps: 5 },
    ],
  },
  {
    id: 'demo-2',
    dateISO: `${daysAgo(9)}T10:00:00.000Z`,
    week: 'W1',
    sessionType: 'UPPER',
    blockId: 'BLK_FORCE_BENCH_01',
    blockName: 'Force bench',
    entries: [
      { exerciseId: 'push_horizontal__bench_press__barbell', loadKg: 55, reps: 6 },
    ],
  },
  {
    id: 'demo-3',
    dateISO: `${daysAgo(16)}T10:00:00.000Z`,
    week: 'W2',
    sessionType: 'UPPER',
    blockId: 'BLK_FORCE_BENCH_01',
    blockName: 'Force bench',
    entries: [
      { exerciseId: 'push_horizontal__bench_press__barbell', loadKg: 62, reps: 5 },
    ],
  },
  {
    id: 'demo-4',
    dateISO: `${daysAgo(23)}T10:00:00.000Z`,
    week: 'W3',
    sessionType: 'UPPER',
    blockId: 'BLK_FORCE_BENCH_01',
    blockName: 'Force bench',
    entries: [
      { exerciseId: 'push_horizontal__bench_press__barbell', loadKg: 65, reps: 5 },
    ],
  },
  {
    id: 'demo-5',
    dateISO: `${daysAgo(30)}T10:00:00.000Z`,
    week: 'W4',
    sessionType: 'UPPER',
    blockId: 'BLK_FORCE_BENCH_01',
    blockName: 'Force bench',
    entries: [
      { exerciseId: 'push_horizontal__bench_press__barbell', loadKg: 70, reps: 4 },
    ],
  },
  {
    id: 'demo-6',
    dateISO: `${daysAgo(3)}T10:00:00.000Z`,
    week: 'W1',
    sessionType: 'LOWER',
    blockId: 'BLK_FORCE_SQUAT_01',
    blockName: 'Force squat',
    entries: [
      { exerciseId: 'squat__front_squat__barbell', loadKg: 80, reps: 5 },
    ],
  },
  {
    id: 'demo-7',
    dateISO: `${daysAgo(17)}T10:00:00.000Z`,
    week: 'W2',
    sessionType: 'LOWER',
    blockId: 'BLK_FORCE_SQUAT_01',
    blockName: 'Force squat',
    entries: [
      { exerciseId: 'squat__front_squat__barbell', loadKg: 85, reps: 5 },
    ],
  },
  {
    id: 'demo-8',
    dateISO: `${daysAgo(31)}T10:00:00.000Z`,
    week: 'W4',
    sessionType: 'LOWER',
    blockId: 'BLK_FORCE_SQUAT_01',
    blockName: 'Force squat',
    entries: [
      { exerciseId: 'squat__front_squat__barbell', loadKg: 90, reps: 5 },
    ],
  },
  {
    id: 'demo-9',
    dateISO: `${daysAgo(5)}T10:00:00.000Z`,
    week: 'W1',
    sessionType: 'UPPER',
    blockId: 'BLK_FORCE_ROW_01',
    blockName: 'Tirage horizontal',
    entries: [
      { exerciseId: 'pull_horizontal__pendlay_row__barbell', loadKg: 50, reps: 8 },
    ],
  },
  {
    id: 'demo-10',
    dateISO: `${daysAgo(19)}T10:00:00.000Z`,
    week: 'W2',
    sessionType: 'UPPER',
    blockId: 'BLK_FORCE_ROW_01',
    blockName: 'Tirage horizontal',
    entries: [
      { exerciseId: 'pull_horizontal__pendlay_row__barbell', loadKg: 55, reps: 7 },
    ],
  },
]

/** Séances complétées (historique) */
export const FAKE_SESSION_LOGS: SessionLog[] = [
  { id: 'demo-s1', dateISO: `${daysAgo(2)}T10:30:00.000Z`, week: 'W1', sessionType: 'UPPER', fatigue: 'OK', rpe: 7, durationMin: 45 },
  { id: 'demo-s2', dateISO: `${daysAgo(3)}T10:30:00.000Z`, week: 'W1', sessionType: 'LOWER', fatigue: 'OK', rpe: 8, durationMin: 50 },
  { id: 'demo-s3', dateISO: `${daysAgo(5)}T10:30:00.000Z`, week: 'W1', sessionType: 'UPPER', fatigue: 'OK', rpe: 6, durationMin: 42 },
  { id: 'demo-s4', dateISO: `${daysAgo(9)}T10:30:00.000Z`, week: 'W1', sessionType: 'UPPER', fatigue: 'OK', rpe: 7, durationMin: 48 },
  { id: 'demo-s5', dateISO: `${daysAgo(16)}T10:30:00.000Z`, week: 'W2', sessionType: 'UPPER', fatigue: 'OK', rpe: 8, durationMin: 52 },
  { id: 'demo-s6', dateISO: `${daysAgo(17)}T10:30:00.000Z`, week: 'W2', sessionType: 'LOWER', fatigue: 'FATIGUE', rpe: 6, durationMin: 45 },
  { id: 'demo-s7', dateISO: `${daysAgo(23)}T10:30:00.000Z`, week: 'W3', sessionType: 'UPPER', fatigue: 'OK', rpe: 8, durationMin: 55 },
  { id: 'demo-s8', dateISO: `${daysAgo(30)}T10:30:00.000Z`, week: 'W4', sessionType: 'UPPER', fatigue: 'OK', rpe: 9, durationMin: 50 },
  { id: 'demo-s9', dateISO: `${daysAgo(31)}T10:30:00.000Z`, week: 'W4', sessionType: 'LOWER', fatigue: 'OK', rpe: 8, durationMin: 48 },
]

/** Tests physiques avec historique pour graphiques */
export const FAKE_ATHLETIC_TESTS: PhysicalTest[] = [
  { id: 'demo-t1', dateISO: daysAgo(45), type: 'cmj', value: 32, notes: 'Test initial' },
  { id: 'demo-t2', dateISO: daysAgo(38), type: 'cmj', value: 33 },
  { id: 'demo-t3', dateISO: daysAgo(31), type: 'cmj', value: 34 },
  { id: 'demo-t4', dateISO: daysAgo(24), type: 'cmj', value: 35 },
  { id: 'demo-t5', dateISO: daysAgo(17), type: 'cmj', value: 36 },
  { id: 'demo-t6', dateISO: daysAgo(10), type: 'cmj', value: 37 },
  { id: 'demo-t7', dateISO: daysAgo(3), type: 'cmj', value: 38 },
  { id: 'demo-t8', dateISO: daysAgo(40), type: 'sprint_10m', value: 2.15 },
  { id: 'demo-t9', dateISO: daysAgo(26), type: 'sprint_10m', value: 2.12 },
  { id: 'demo-t10', dateISO: daysAgo(12), type: 'sprint_10m', value: 2.08 },
  { id: 'demo-t11', dateISO: daysAgo(5), type: 'sprint_10m', value: 2.05 },
  { id: 'demo-t12', dateISO: daysAgo(35), type: 'one_rm_squat', value: 100, estimatedFrom: { loadKg: 80, reps: 5, formula: 'brzycki' } },
  { id: 'demo-t13', dateISO: daysAgo(21), type: 'one_rm_squat', value: 105, estimatedFrom: { loadKg: 85, reps: 5, formula: 'brzycki' } },
  { id: 'demo-t14', dateISO: daysAgo(7), type: 'one_rm_squat', value: 110, estimatedFrom: { loadKg: 90, reps: 5, formula: 'brzycki' } },
  { id: 'demo-t15', dateISO: daysAgo(30), type: 'yyir1', value: 1200 },
  { id: 'demo-t16', dateISO: daysAgo(15), type: 'yyir1', value: 1320 },
  { id: 'demo-t17', dateISO: daysAgo(2), type: 'yyir1', value: 1440 },
]

/** Enregistre les données de démo dans localStorage et active le mode démo. Puis recharger la page. */
export function seedDemoData(): void {
  try {
    window.localStorage.setItem(BLOCK_LOGS_KEY, JSON.stringify(FAKE_BLOCK_LOGS))
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(FAKE_SESSION_LOGS))
    window.localStorage.setItem(ATHLETIC_TESTS_KEY, JSON.stringify(FAKE_ATHLETIC_TESTS))
    window.localStorage.setItem(DEMO_MODE_KEY, '1')
    console.log('[RugbyForge] Données démo chargées. Rechargement…')
  } catch (e) {
    console.error('[RugbyForge] Erreur seed demo:', e)
    throw e
  }
}

/** Désactive le mode démo et efface les données démo. Au rechargement, les hooks récupéreront les vraies données Supabase. */
export function clearDemoMode(): void {
  try {
    window.localStorage.removeItem(DEMO_MODE_KEY)
    window.localStorage.removeItem(BLOCK_LOGS_KEY)
    window.localStorage.removeItem(HISTORY_KEY)
    window.localStorage.removeItem(ATHLETIC_TESTS_KEY)
    console.log('[RugbyForge] Mode démo désactivé.')
  } catch (e) {
    console.error('[RugbyForge] Erreur clear demo:', e)
    throw e
  }
}
