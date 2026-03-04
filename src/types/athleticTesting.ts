export type PhysicalTestType =
  | 'cmj'              // cm — higher is better
  | 'sprint_10m'       // secondes — lower is better
  | 'yyir1'            // mètres — higher is better
  | 'one_rm_squat'     // kg
  | 'one_rm_bench'     // kg
  | 'one_rm_deadlift'  // kg
  | 'hooper'           // score 4–28 — lower is better

export interface PhysicalTest {
  id: string
  dateISO: string        // YYYY-MM-DD
  type: PhysicalTestType
  value: number
  estimatedFrom?: { loadKg: number; reps: number; formula: 'brzycki' | 'epley' }
  notes?: string
}

export interface PositionBaseline {
  pro: number
  amateur: number
  beginner: number
  unit: string
  higherIsBetter: boolean
}
