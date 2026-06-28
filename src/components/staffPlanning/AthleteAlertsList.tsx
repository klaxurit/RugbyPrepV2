import type { StaffAlert } from '../../types/staffPlanning'
import type { StaffRosterTheme } from './StaffRosterTable'

const severityStyles: Record<
  StaffAlert['severity'],
  { border: string; bg: string; label: string; message: string }
> = {
  info: {
    border: 'border-sky-500/40',
    bg: 'bg-sky-500/10',
    label: 'Info',
    message: 'text-fg',
  },
  warning: {
    border: 'border-amber-500/50',
    bg: 'bg-amber-500/10',
    label: 'Attention',
    message: 'text-fg',
  },
  critical: {
    border: 'border-red-500/60',
    bg: 'bg-red-500/15',
    label: 'Critique',
    message: 'text-fg',
  },
}

const severityStylesDark: Record<
  StaffAlert['severity'],
  { border: string; bg: string; label: string; message: string }
> = {
  info: {
    border: 'border-sky-500/40',
    bg: 'bg-sky-500/10',
    label: 'Info',
    message: 'text-neutral-100',
  },
  warning: {
    border: 'border-amber-500/50',
    bg: 'bg-amber-500/10',
    label: 'Attention',
    message: 'text-neutral-100',
  },
  critical: {
    border: 'border-red-500/60',
    bg: 'bg-red-500/15',
    label: 'Critique',
    message: 'text-neutral-100',
  },
}

export interface AthleteAlertsListProps {
  alerts: StaffAlert[]
  theme?: StaffRosterTheme
}

export function AthleteAlertsList({ alerts, theme = 'app' }: AthleteAlertsListProps) {
  const palette = theme === 'dark' ? severityStylesDark : severityStyles
  const emptyClass = theme === 'dark' ? 'text-neutral-500' : 'text-fg-muted'

  if (alerts.length === 0) {
    return <p className={`m-0 text-xs ${emptyClass}`}>Aucune alerte</p>
  }

  return (
    <ul className="m-0 list-none space-y-2 p-0" role="list">
      {alerts.map((a, i) => {
        const s = palette[a.severity]
        return (
          <li
            key={`${a.code}-${i}`}
            role="listitem"
            data-severity={a.severity}
            className={`flex gap-2 rounded-lg border px-2 py-1.5 text-xs leading-snug ${s.border} ${s.bg}`}
          >
            <span
              className="shrink-0 text-[10px] font-semibold uppercase tracking-wide opacity-90"
              style={{ color: a.severity === 'critical' ? '#f87171' : undefined }}
            >
              {s.label}
            </span>
            <span className={s.message}>{a.message}</span>
          </li>
        )
      })}
    </ul>
  )
}
