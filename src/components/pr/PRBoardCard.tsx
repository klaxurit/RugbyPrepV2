import { Trophy, Dumbbell, Hash, Timer, Ruler } from 'lucide-react'
import { getExerciseName } from '../../data/exercises'
import type { ExerciseMetricType } from '../../types/training'

export interface PRRecord {
  exerciseId: string
  metricType: ExerciseMetricType
  bestValue: number
  bestLabel: string
  dateISO: string
  isRecent: boolean
}

const METRIC_ICON: Record<ExerciseMetricType, typeof Dumbbell> = {
  load_reps: Dumbbell,
  reps: Hash,
  seconds: Timer,
  meters: Ruler,
}

const MONTHS_FR = ['jan', 'fev', 'mar', 'avr', 'mai', 'jun', 'jul', 'aou', 'sep', 'oct', 'nov', 'dec']

function formatDate(iso: string, lang: 'fr' | 'en'): string {
  const [y, m, d] = iso.split('-')
  if (lang === 'fr') return `${parseInt(d)} ${MONTHS_FR[parseInt(m) - 1]} ${y}`
  return `${m}/${d}/${y}`
}

export function PRBoardCard({ pr, lang = 'fr' }: { pr: PRRecord; lang?: 'fr' | 'en' }) {
  const Icon = METRIC_ICON[pr.metricType] ?? Dumbbell
  const isTest = pr.exerciseId.startsWith('test_')
  const name = isTest
    ? pr.exerciseId.replace('test_', '').replace(/_/g, ' ').replace('one rm ', '1RM ')
    : getExerciseName(pr.exerciseId, lang)

  return (
    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-[20px] p-4">
      {/* Metric icon */}
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-soft">
        <Icon className="h-4.5 w-4.5 text-brand" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white truncate">{name}</p>
        <p className="text-lg font-black text-brand">{pr.bestLabel}</p>
        <p className="text-[10px] text-white/40">{formatDate(pr.dateISO, lang)}</p>
      </div>

      {/* Trophy */}
      <Trophy className={`h-5 w-5 flex-shrink-0 ${pr.isRecent ? 'text-warn-strong' : 'text-white/20'}`} />
    </div>
  )
}
