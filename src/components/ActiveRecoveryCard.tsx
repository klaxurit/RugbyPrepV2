import { useState } from 'react'
import { Check } from 'lucide-react'
import { ACTIVE_RECOVERY_ACTIVITIES } from './activeRecoveryConstants'

export type { ActiveRecoveryActivity } from './activeRecoveryConstants'

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
      <p className="text-[9px] font-bold text-info/75 uppercase tracking-wider">
        {isRecoveryDay ? 'Récup post-match · accélère ta récupération' : 'Récup active · accélère ta récupération'}
      </p>

      {/* Activity chips — grille 2×2 */}
      <div className="grid grid-cols-2 gap-1">
        {ACTIVE_RECOVERY_ACTIVITIES.map((a) => (
          <button
            key={a.id}
            type="button"
            data-testid={`ar-activity-${a.id}`}
            onClick={() => setSelected(selected === a.id ? null : a.id)}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold transition-colors ${
              selected === a.id
                ? 'bg-info-bg border border-info-bd text-info'
                : 'bg-blue-50 border border-blue-100 text-blue-400 hover:bg-blue-100 hover:text-blue-500'
            }`}
          >
            <span>{a.icon}</span>
            <span className={selected === a.id ? 'text-info' : ''}>{a.shortLabel}</span>
            <span className="opacity-70">{a.duration}</span>
          </button>
        ))}
      </div>

      {/* Detail line + confirm — only when an activity is selected */}
      {selected && (() => {
        const activity = ACTIVE_RECOVERY_ACTIVITIES.find((act) => act.id === selected)!
        return (
          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-[9px] text-fg-muted flex-1">
              {activity.label} · RPE 2-3 · Favorise la récupération
            </span>
            <button
              type="button"
              data-testid="ar-complete-btn"
              onClick={() => onComplete(activity.id, activity.durationMin, 2)}
              className="px-2.5 py-1 rounded-lg bg-info-bg border border-info-bd text-info text-[9px] font-black hover:opacity-90 transition-opacity flex-shrink-0"
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
 * Pastille après récup active complétée (bleu info — distinct du vert club et de l’orange séance faite).
 */
export function ActiveRecoveryBadge() {
  return (
    <span
      data-testid="active-recovery-badge"
      className="inline-flex items-center gap-1 rounded-full border border-info-bd bg-info-bg px-2.5 py-1 text-[10px] font-bold text-info"
    >
      <Check className="w-3 h-3 shrink-0" aria-hidden />
      Récup active
    </span>
  )
}
