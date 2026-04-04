import { useState } from 'react'
import { Check, Footprints, Bike, Waves, Leaf } from 'lucide-react'

export interface ActiveRecoveryActivity {
  id: string
  label: string
  shortLabel: string
  duration: string
  durationMin: number
  icon: React.ReactNode
}

export const ACTIVITIES: ActiveRecoveryActivity[] = [
  { id: 'walk', shortLabel: 'Marche', label: 'Marche', duration: '20-30\'', durationMin: 25, icon: <Footprints className="w-3 h-3" /> },
  { id: 'bike', shortLabel: 'Vélo', label: 'Vélo léger', duration: '15-20\'', durationMin: 17, icon: <Bike className="w-3 h-3" /> },
  { id: 'mobility', shortLabel: 'Mobilité', label: 'Mobilité / Yoga', duration: '15-20\'', durationMin: 17, icon: <Leaf className="w-3 h-3" /> },
  { id: 'swim', shortLabel: 'Natation', label: 'Natation légère', duration: '20-30\'', durationMin: 25, icon: <Waves className="w-3 h-3" /> },
]

interface InlineActiveRecoveryProps {
  isRecoveryDay: boolean
  onComplete: (activityType: string, durationMin: number, rpe: number) => void
}

/**
 * Compact inline active-recovery module for rest-day rows in the calendar timeline.
 * Shows 4 small activity choices; selecting one reveals a detail line + Fait ✓ button.
 */
export function InlineActiveRecovery({ isRecoveryDay, onComplete }: InlineActiveRecoveryProps) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div data-testid="inline-active-recovery" className="space-y-1.5">
      <p className="text-[9px] font-bold text-teal-400/60 uppercase tracking-wider">
        {isRecoveryDay ? 'Récup post-match' : 'Récup active · optionnel'}
      </p>

      {/* Compact activity chips — wrap on narrow screens */}
      <div className="flex flex-wrap gap-1">
        {ACTIVITIES.map((a) => (
          <button
            key={a.id}
            type="button"
            data-testid={`ar-activity-${a.id}`}
            onClick={() => setSelected(selected === a.id ? null : a.id)}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold transition-colors ${
              selected === a.id
                ? 'bg-teal-500/20 border border-teal-400/30 text-teal-200'
                : 'bg-white/[0.04] border border-transparent text-white/40 hover:bg-white/[0.07]'
            }`}
          >
            <span className={selected === a.id ? 'text-teal-300' : 'text-white/25'}>{a.icon}</span>
            <span>{a.shortLabel}</span>
            <span className={`${selected === a.id ? 'text-teal-400/70' : 'text-white/20'}`}>{a.duration}</span>
          </button>
        ))}
      </div>

      {/* Detail line + confirm — only when an activity is selected */}
      {selected && (() => {
        const activity = ACTIVITIES.find((act) => act.id === selected)!
        return (
          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-[9px] text-teal-400/50 flex-1">
              {activity.label} · RPE 2-3 · Favorise la récupération
            </span>
            <button
              type="button"
              data-testid="ar-complete-btn"
              onClick={() => onComplete(activity.id, activity.durationMin, 2)}
              className="px-2.5 py-1 rounded-lg bg-teal-500/20 text-teal-300 text-[9px] font-black hover:bg-teal-500/30 transition-colors flex-shrink-0"
            >
              Fait ✓
            </button>
          </div>
        )
      })()}
    </div>
  )
}

/**
 * Compact teal badge shown after active recovery completion.
 */
export function ActiveRecoveryBadge() {
  return (
    <span
      data-testid="active-recovery-badge"
      className="inline-flex items-center gap-1 rounded-full border border-teal-500/20 bg-teal-900/15 px-2.5 py-1 text-[10px] font-bold text-teal-300"
    >
      <Check className="w-3 h-3" />
      Récup active
    </span>
  )
}
