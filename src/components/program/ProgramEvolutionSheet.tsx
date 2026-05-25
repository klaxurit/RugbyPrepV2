import { Sparkles, X } from 'lucide-react'
import { BottomSheet } from '../ui/BottomSheet'
import { DEFAULT_PROGRAM_EVOLUTION_BULLETS } from './programEvolutionSheetConstants'

export interface ProgramEvolutionSheetProps {
  open: boolean
  /** Fermeture backdrop / swipe / X — peut être no-op si {@link blockFlexibleDismiss}. */
  onBackdropAttemptClose: () => void
  /** CTA principal : action snapshot ou simple ack selon le parent. */
  onCtaPress: () => void | Promise<void>
  /** Blocage swipe / backdrop / bouton fermer (flux confirmation obligatoire). */
  blockFlexibleDismiss?: boolean
  primaryBusy?: boolean
  eyebrow?: string
  sectionTitle?: string
  summary: string
  bullets?: readonly string[]
  ctaLabel?: string
  secondaryCtaLabel?: string
  onSecondaryPress?: () => void
  secondaryHint?: string
}

/**
 * Bottom sheet éditoriale alignée sur {@link SessionFinishedSheet} :
 * même coque {@link BottomSheet}, mêmes gouttières, même titre serif en deux lignes
 * (accroche puis précision atténuée `text-fg/70`). CTA principal pleine largeur.
 * Contenu paramétrable (match ajouté, sync FFR, etc.).
 */
export function ProgramEvolutionSheet({
  open,
  onBackdropAttemptClose,
  onCtaPress,
  blockFlexibleDismiss = false,
  primaryBusy = false,
  eyebrow = 'Ton programme évolue',
  sectionTitle = 'Semaine de match',
  summary,
  bullets = DEFAULT_PROGRAM_EVOLUTION_BULLETS,
  ctaLabel = 'C\'est compris, on y va',
  secondaryCtaLabel,
  onSecondaryPress,
  secondaryHint,
}: ProgramEvolutionSheetProps) {
  return (
    <BottomSheet
      open={open}
      onClose={onBackdropAttemptClose}
      ariaLabel={eyebrow}
      hideDefaultHeader
      disableSwipeDismiss={blockFlexibleDismiss || primaryBusy}
      disableBackdropDismiss={blockFlexibleDismiss || primaryBusy}
      showClose={!blockFlexibleDismiss && !primaryBusy}
    >
      <div className="px-5 pb-4 pt-1" data-testid="program-change-modal">
        <div
          data-testid="program-evolution-eyebrow"
          className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-brand-tint"
        >
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-brand text-on-brand">
            <Sparkles className="h-2.5 w-2.5" strokeWidth={3} />
          </span>
          {eyebrow}
        </div>
        <h2
          data-testid="program-evolution-title"
          className="mt-3 font-serif italic font-extrabold leading-[1.05] text-fg [text-wrap:balance]"
          style={{ fontSize: 30, letterSpacing: '-0.6px' }}
        >
          {sectionTitle}
          <br />
          <span data-testid="program-evolution-summary" className="text-fg/70">
            {summary}
          </span>
        </h2>
        <ul className="mt-5 space-y-2.5" data-testid="program-evolution-bullets">
          {bullets.map((b, i) => (
            <li
              key={`${i}-${b.slice(0, 24)}`}
              className="flex gap-2.5 text-[12px] font-bold leading-snug text-fg-muted"
            >
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand" aria-hidden />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => void onCtaPress()}
            disabled={primaryBusy}
            data-testid="program-evolution-cta"
            className="w-full rounded-2xl bg-brand py-4 text-sm font-black uppercase italic tracking-wide text-on-brand transition-colors hover:bg-brand-hover shadow-lg shadow-brand-glow disabled:opacity-60 rf-focus-ring"
          >
            {primaryBusy ? 'Mise à jour…' : ctaLabel}
          </button>
          {secondaryCtaLabel && onSecondaryPress && (
            <button
              type="button"
              onClick={onSecondaryPress}
              disabled={primaryBusy}
              data-testid="program-change-postpone"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-2xl border border-border-app bg-layer-5 py-3 text-xs font-bold text-fg-soft transition-colors hover:border-layer-20 rf-focus-ring disabled:opacity-60"
            >
              <X className="h-3.5 w-3.5" />
              {secondaryCtaLabel}
            </button>
          )}
          {secondaryHint && (
            <p className="text-center text-[11px] text-fg-muted">{secondaryHint}</p>
          )}
        </div>
      </div>
    </BottomSheet>
  )
}
