import type { StaffAlert } from '../../types/staffPlanning'

const severityStyles: Record<
  StaffAlert['severity'],
  { border: string; bg: string; label: string }
> = {
  info: {
    border: 'border-sky-500/40',
    bg: 'bg-sky-500/10',
    label: 'Info',
  },
  warning: {
    border: 'border-amber-500/50',
    bg: 'bg-amber-500/10',
    label: 'Attention',
  },
  critical: {
    border: 'border-red-500/60',
    bg: 'bg-red-500/15',
    label: 'Critique',
  },
}

export interface AthleteAlertsListProps {
  alerts: StaffAlert[]
}

export function AthleteAlertsList({ alerts }: AthleteAlertsListProps) {
  if (alerts.length === 0) {
    return <p className="m-0 text-xs text-neutral-500">Aucune alerte</p>
  }

  return (
    <ul className="m-0 list-none space-y-2 p-0" role="list">
      {alerts.map((a, i) => {
        const s = severityStyles[a.severity]
        return (
          <li
            key={`${a.code}-${i}`}
            role="listitem"
            data-severity={a.severity}
            className={`flex gap-2 rounded-lg border px-2 py-1.5 text-xs leading-snug ${s.border} ${s.bg}`}
          >
            <span
              className="shrink-0 font-semibold uppercase tracking-wide text-[10px] opacity-90"
              style={{ color: a.severity === 'critical' ? '#f87171' : undefined }}
            >
              {s.label}
            </span>
            <span className="text-neutral-100">{a.message}</span>
          </li>
        )
      })}
    </ul>
  )
}
