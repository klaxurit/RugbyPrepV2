import { Check, Minus } from 'lucide-react'

/** Aligné spec UX figée : `completed` = terminée / faite, `missed` = passée, `skipped` = sautée. */
export type SessionStatus = 'completed' | 'missed' | 'skipped'

export interface SessionStatusIndicatorProps {
  status: SessionStatus
  /** Sautée uniquement : action explicite utilisateur, si le produit autorise l’annulation. */
  onUndo?: () => void
  undoLabel?: string
  className?: string
  'data-testid'?: string
}

/**
 * Indicateur de statut séance — trois branches visuelles et noms accessibles distincts.
 * Vocabulaire métier uniquement ici ; pas de logique de données.
 */
export function SessionStatusIndicator({
  status,
  onUndo,
  undoLabel = 'Annuler',
  className = '',
  'data-testid': dataTestId = 'session-status-indicator',
}: SessionStatusIndicatorProps) {
  const gap = 'inline-flex items-center gap-1.5 flex-wrap max-w-[100%]'

  if (status === 'completed') {
    return (
      <span
        role="group"
        aria-label="Séance terminée"
        data-testid={dataTestId}
        data-session-status="completed"
        title="Séance terminée"
        className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full border ${className}`}
        style={{
          color: 'var(--color-session-completed-fg)',
          backgroundColor: 'var(--color-session-completed-bg)',
          borderColor: 'var(--color-session-completed-bd)',
        }}
      >
        <Check className="size-3 shrink-0 stroke-[2.25]" stroke="currentColor" aria-hidden />
      </span>
    )
  }

  if (status === 'missed') {
    return (
      <span
        role="group"
        aria-label="Créneau dépassé sans complétion de séance"
        data-testid={dataTestId}
        data-session-status="missed"
        className={`${gap} rounded-lg border px-2 py-0.5 text-[0.7rem] font-semibold tracking-tight ${className}`}
        style={{
          color: 'var(--color-session-missed-fg)',
          backgroundColor: 'var(--color-session-missed-bg)',
          borderColor: 'var(--color-session-missed-bd)',
        }}
      >
        <Minus className="h-3.5 w-3.5 shrink-0 opacity-80" strokeWidth={2.5} aria-hidden />
        <span aria-hidden>Passée</span>
      </span>
    )
  }

  return (
    <span
      role="group"
      aria-label={onUndo ? 'Séance sautée, annulation possible' : 'Séance sautée'}
      data-testid={dataTestId}
      data-session-status="skipped"
      className={`${gap} rounded-lg border px-2 py-0.5 text-[0.7rem] font-semibold tracking-tight ${className}`}
      style={{
        color: 'var(--color-session-skipped-fg)',
        backgroundColor: 'var(--color-session-skipped-bg)',
        borderColor: 'var(--color-session-skipped-bd)',
      }}
    >
      <span className="inline-flex items-center gap-1" aria-hidden>
        <Minus className="h-3.5 w-3.5 shrink-0 opacity-80" strokeWidth={2.5} />
        <span>Sautée</span>
      </span>
      {onUndo ? (
        <button
          type="button"
          onClick={onUndo}
          className="shrink-0 font-semibold underline underline-offset-2 text-[0.65rem] opacity-90 hover:opacity-100 focus-visible:outline focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-1 rounded-sm"
        >
          {undoLabel}
        </button>
      ) : null}
    </span>
  )
}
