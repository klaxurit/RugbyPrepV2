import { Icon } from '../ui'

export type StickyCTAVariant =
  | { kind: 'start'; onStart: () => void; onMarkDone?: () => void; premiumHint?: boolean }
  | { kind: 'finish'; onFinish: () => void }
  | {
      kind: 'validate-exo' | 'validate-block'
      eyebrow: string
      label: string
      onValidate: () => void
    }

interface SessionStickyCTAProps {
  variant: StickyCTAVariant
}

/**
 * Barre d'action contextuelle en bas de page Séance. 4 variants :
 *  - `start`         : "Commencer la séance" full-width (idle)
 *  - `finish`        : "Voir le récap" (completed)
 *  - `validate-exo`  : carte flottante bordeaux avec eyebrow+label+flèche (running)
 *  - `validate-block`: idem, libellé adapté
 *
 * Le composant est positionné par la page (sticky bottom + safe-area).
 */
export function SessionStickyCTA({ variant }: SessionStickyCTAProps) {
  if (variant.kind === 'start') {
    return (
      <div className="border-t border-paper-deep bg-app px-[18px] pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-2.5">
        {variant.premiumHint && (
          <p className="mb-2 text-center text-[11px] text-fg/65">
            Débloque le suivi set-par-set —{' '}
            <a href="/profile#premium" className="text-brand underline hover:text-brand-hover">
              Découvrir Pro
            </a>
          </p>
        )}
        <button
          type="button"
          data-testid="ms-start-btn"
          onClick={variant.onStart}
          className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-brand text-app text-[14px] font-extrabold uppercase tracking-[0.06em] active:scale-[0.98] transition-transform rf-focus-ring"
          style={{ boxShadow: '0 12px 28px rgba(123, 13, 30, 0.4)' }}
        >
          <Icon name="play" size={13} strokeWidth={2.4} />
          Commencer la séance
        </button>
        {variant.onMarkDone && (
          <button
            type="button"
            data-testid="ms-complete-btn"
            onClick={variant.onMarkDone}
            className="mt-2 block w-full text-center text-[11px] text-fg/60 hover:text-fg transition-colors"
          >
            Marquer comme faite (sans la lancer)
          </button>
        )}
      </div>
    )
  }

  if (variant.kind === 'finish') {
    return (
      <div className="border-t border-paper-deep bg-app px-[18px] pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-2.5">
        <button
          type="button"
          onClick={variant.onFinish}
          className="flex h-13 w-full items-center justify-center gap-2.5 rounded-2xl bg-brand text-app text-[13px] font-extrabold uppercase tracking-[0.06em] py-3.5 active:scale-[0.98] transition-transform rf-focus-ring"
        >
          Voir le récap
          <Icon name="arrow-right" size={12} strokeWidth={2.4} />
        </button>
      </div>
    )
  }

  // validate-exo | validate-block — carte flottante bordeaux entièrement cliquable
  return (
    <button
      type="button"
      onClick={variant.onValidate}
      aria-label={`${variant.eyebrow} — ${variant.label}`}
      className="mx-[14px] mb-[max(0.875rem,env(safe-area-inset-bottom))] flex w-[calc(100%-28px)] items-center gap-3 rounded-[18px] bg-brand text-app text-left px-3.5 py-3 animate-rf-slide-up active:scale-[0.99] transition-transform rf-focus-ring"
      style={{ boxShadow: '0 16px 32px rgba(123, 13, 30, 0.45)' }}
    >
      <span
        aria-hidden
        className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[10px] border-[1.5px] border-app/35 bg-app/10"
      >
        <Icon name="check" size={20} strokeWidth={2.6} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[9px] font-extrabold uppercase tracking-[0.16em] opacity-80">
          {variant.eyebrow}
        </span>
        <span
          className="mt-0.5 block truncate font-extrabold italic"
          style={{ fontSize: 13, letterSpacing: '0.02em' }}
        >
          {variant.label}
        </span>
      </span>
      <span
        aria-hidden
        className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-full bg-app text-brand"
      >
        <Icon name="arrow-right" size={16} color="var(--color-accent)" strokeWidth={2.4} />
      </span>
    </button>
  )
}
