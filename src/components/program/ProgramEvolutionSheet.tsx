import { Sparkles } from 'lucide-react'
import { BottomSheet } from '../ui/BottomSheet'

export const DEFAULT_PROGRAM_EVOLUTION_BULLETS: readonly string[] = [
  'Charge réduite à mesure qu\'on approche du match',
  'Dernière séance au moins 48h avant',
  'Mobilité et activation ajoutées',
]

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
      <div className="px-5 pb-4 pt-1">
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
        <button
          type="button"
          onClick={() => void onCtaPress()}
          disabled={primaryBusy}
          data-testid="program-evolution-cta"
          className="mt-6 w-full rounded-2xl bg-brand py-4 text-sm font-black uppercase italic tracking-wide text-on-brand transition-colors hover:bg-brand-hover shadow-lg shadow-brand-glow disabled:opacity-60"
        >
          {primaryBusy ? 'Mise à jour…' : ctaLabel}
        </button>
      </div>
    </BottomSheet>
  )
}
