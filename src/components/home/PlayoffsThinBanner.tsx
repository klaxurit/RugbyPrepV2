import { Icon } from '../ui'

interface PlayoffsThinBannerProps {
  /** Click → action métier (active le mode Playoffs côté profil). */
  onActivate: () => void
  /** X discret (passe le banner en dismissed via la machine d'état des transitions). */
  onDismiss?: () => void
}

/**
 * Bandeau fin "Phase finale ?" — remplace la grande card SeasonTransitionBanner
 * pour le type `playoffs_suggested`. Suit le pattern du handoff `accueil.jsx`
 * (~ligne 467) : bordure bordeaux 1px à 55% d'opacité, fond transparent,
 * trophée à gauche, 2 lignes de texte, chevron à droite.
 */
export function PlayoffsThinBanner({ onActivate, onDismiss }: PlayoffsThinBannerProps) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors"
      style={{
        background: 'transparent',
        border: '1px solid rgb(123 13 30 / 0.55)',
      }}
    >
        <button
          type="button"
          onClick={onActivate}
          className="flex flex-1 items-center gap-3 text-left rf-focus-ring rounded-lg active:scale-[0.99] transition-transform"
          aria-label="Activer le mode Playoffs"
        >
          <Icon
            name="trophy"
            size={14}
            color="var(--color-accent)"
            strokeWidth={2.2}
          />
          <div className="min-w-0 flex-1">
            <div
              className="text-[11px] font-bold leading-[1.3] text-brand"
              style={{ letterSpacing: '0.2px' }}
            >
              Phase finale ?
            </div>
            <div className="mt-px text-[10px] font-medium text-fg/60">
              Active le mode Playoffs · programme d&apos;affûtage
            </div>
          </div>
          <Icon
            name="arrow-right"
            size={12}
            color="var(--color-accent)"
            strokeWidth={2.4}
          />
        </button>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Masquer cette suggestion"
            className="flex h-6 w-6 items-center justify-center rounded text-brand/60 hover:text-brand hover:bg-brand-soft transition-colors rf-focus-ring"
          >
            <span aria-hidden className="text-base leading-none">×</span>
        </button>
      )}
    </div>
  )
}
