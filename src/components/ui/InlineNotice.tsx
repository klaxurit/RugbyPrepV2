import { useId, type ReactNode } from 'react'

export type InlineNoticeTone = 'info' | 'warning' | 'neutral'

export interface InlineNoticeProps {
  /** Titre court optionnel (affiche un id pour aria-labelledby). */
  title?: string
  /** Corps du message. */
  children?: ReactNode
  /** Style de fond / bordure — sans sémantique métier. */
  tone?: InlineNoticeTone
  /** Libellé du lien ou bouton secondaire (ex. « Pourquoi ? »). */
  learnMoreLabel?: string
  /** Lien navigation (prioritaire sur onLearnMore si les deux sont fournis). */
  learnMoreHref?: string
  /** Appelé au clic sur « en savoir plus » si pas de href. */
  onLearnMore?: () => void
  /** Fermeture optionnelle (n’impacte que l’UI locale — l’appelant gère l’état). */
  onDismiss?: () => void
  dismissLabel?: string
  className?: string
  /** Si pas de title, fournir un libellé accessible pour la region. */
  'aria-label'?: string
  'data-testid'?: string
}

/** Aligné sur les ponts Tailwind `info` / `warn` / surfaces app (`global.css` @theme). */
const toneShell: Record<InlineNoticeTone, string> = {
  info: 'border-info-bd bg-info-bg text-fg-secondary',
  warning: 'border-warn-bd bg-warn-bg-muted text-warn-body',
  neutral: 'border-border-app bg-layer-5 text-fg-secondary',
}

const titleToneClass: Record<InlineNoticeTone, string> = {
  info: 'text-info',
  warning: 'text-warn-strong',
  neutral: 'text-fg',
}

const learnMoreToneClass: Record<InlineNoticeTone, string> = {
  info: 'text-info hover:opacity-90',
  warning: 'text-warn-strong hover:opacity-90',
  neutral: 'text-fg-soft hover:text-fg-secondary',
}

/**
 * Bandeau contextuel neutre (design system). Aucun vocabulaire planning — à composer
 * depuis `PlanningContextBanner` ou usages génériques.
 */
export function InlineNotice({
  title,
  children,
  tone = 'neutral',
  learnMoreLabel,
  learnMoreHref,
  onLearnMore,
  onDismiss,
  dismissLabel = 'Fermer',
  className = '',
  'aria-label': ariaLabel,
  'data-testid': dataTestId,
}: InlineNoticeProps) {
  const reactId = useId()
  const titleId = title ? `${reactId}-title` : undefined
  const hasLearnMore = Boolean(learnMoreLabel && (learnMoreHref || onLearnMore))
  const labelledBy = titleId ?? undefined

  const base =
    'rounded-xl border px-3 py-2.5 text-sm leading-snug shadow-sm ' +
    toneShell[tone] +
    (className ? ` ${className}` : '')

  return (
    <section
      className={base}
      role="region"
      aria-label={!labelledBy ? ariaLabel : undefined}
      aria-labelledby={labelledBy}
      data-testid={dataTestId}
    >
      <div className="flex gap-2 justify-between items-start">
        <div className="min-w-0 flex-1 space-y-1">
          {title ? (
            <p
              id={titleId}
              className={`font-semibold text-[0.8125rem] tracking-tight ${titleToneClass[tone]}`}
            >
              {title}
            </p>
          ) : null}
          {children ? <div className="text-[0.8125rem]">{children}</div> : null}
          {hasLearnMore ? (
            <div className="pt-0.5">
              {learnMoreHref ? (
                <a
                  href={learnMoreHref}
                  className={`font-semibold underline underline-offset-2 text-[0.75rem] rounded-sm rf-focus-ring ${learnMoreToneClass[tone]}`}
                >
                  {learnMoreLabel}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={onLearnMore}
                  className={`font-semibold underline underline-offset-2 text-[0.75rem] text-left rounded-sm rf-focus-ring ${learnMoreToneClass[tone]}`}
                >
                  {learnMoreLabel}
                </button>
              )}
            </div>
          ) : null}
        </div>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded-lg px-1.5 py-0.5 text-[0.7rem] font-semibold text-fg-muted opacity-80 hover:opacity-100 rf-focus-ring"
            aria-label={dismissLabel}
          >
            ×
          </button>
        ) : null}
      </div>
    </section>
  )
}
