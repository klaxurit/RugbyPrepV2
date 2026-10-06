import { Sparkles, X } from 'lucide-react'
import { BottomSheet } from '../ui/BottomSheet'
import { DEFAULT_PROGRAM_EVOLUTION_BULLETS } from './programEvolutionSheetConstants'
import type { FatigueLoadChoiceOption } from '../../services/program/fatigueLoadChoice'

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
  choices?: FatigueLoadChoiceOption[]
  selectedChoiceId?: string
  onSelectChoice?: (id: string) => void
  recommendedBadgeLabel?: string
  /**
   * Étape 2 du flux choix ACWR : confirmation justifiée avant apply.
   * `null` = liste de choix (ou bullets classiques).
   */
  choiceConfirm?: { title: string; body: string } | null
}

/**
 * Bottom sheet éditoriale alignée sur {@link SessionFinishedSheet} :
 * même coque {@link BottomSheet}, mêmes gouttières, même titre serif en deux lignes
 * (accroche puis précision atténuée `text-fg/70`). CTA principal pleine largeur.
 * Contenu paramétrable (match ajouté, sync FFR, choix fatigue ACWR, etc.).
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
  choices,
  selectedChoiceId,
  onSelectChoice,
  recommendedBadgeLabel = 'Recommandé',
  choiceConfirm = null,
}: ProgramEvolutionSheetProps) {
  const hasChoices = Boolean(choices && choices.length > 0) && !choiceConfirm
  const inConfirm = Boolean(choiceConfirm)

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
          {inConfirm ? choiceConfirm!.title : sectionTitle}
          <br />
          <span data-testid="program-evolution-summary" className="text-fg/70">
            {inConfirm ? choiceConfirm!.body : summary}
          </span>
        </h2>

        {hasChoices ? (
          <div
            className="mt-5 space-y-2"
            role="radiogroup"
            aria-label={sectionTitle}
            data-testid="program-evolution-choices"
          >
            {choices!.map((opt) => {
              const selected = selectedChoiceId === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={opt.disabled || primaryBusy}
                  data-testid={`program-evolution-choice-${opt.id}`}
                  onClick={() => onSelectChoice?.(opt.id)}
                  className={[
                    'w-full rounded-2xl border px-3.5 py-3 text-left transition-colors rf-focus-ring',
                    selected
                      ? 'border-brand bg-brand/10'
                      : 'border-border-app bg-layer-5 hover:border-layer-20',
                    opt.disabled ? 'opacity-50' : '',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-black text-fg">{opt.label}</span>
                    {opt.recommended && (
                      <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-brand-tint">
                        {recommendedBadgeLabel}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] font-bold leading-snug text-fg-muted">
                    {opt.disabled && opt.disabledReason ? opt.disabledReason : opt.description}
                  </p>
                </button>
              )
            })}
          </div>
        ) : !inConfirm ? (
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
        ) : null}

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => void onCtaPress()}
            disabled={primaryBusy || (hasChoices && !selectedChoiceId)}
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
              data-testid={inConfirm ? 'program-evolution-back-choice' : 'program-change-postpone'}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-2xl border border-border-app bg-layer-5 py-3 text-xs font-bold text-fg-soft transition-colors hover:border-layer-20 rf-focus-ring disabled:opacity-60"
            >
              <X className="h-3.5 w-3.5" />
              {secondaryCtaLabel}
            </button>
          )}
          {secondaryHint && !inConfirm && (
            <p className="text-center text-[11px] text-fg-muted">{secondaryHint}</p>
          )}
        </div>
      </div>
    </BottomSheet>
  )
}
