import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, ChevronDown, MessageCircle, Sparkles, X } from 'lucide-react'
import type { WeekExplanation } from '../../types/scheduling'
import { useHintVisibility } from '../../hooks/useHintVisibility'

/** Courbe déjà utilisée sur le hero (note modulation) — sortie douce, pas « flash ». */
const CARD_EASE = [0.2, 0.8, 0.2, 1] as const

interface PlanningContextCardProps {
  explanation: WeekExplanation
  /** Optional cycle/week label for the card header. */
  weekLabel?: string
  /** Reserved for back-compat (no longer rendered here). */
  companionRecommendations?: string[]
  warnings?: string[]
  hideCorrections?: boolean
  /** Hash de contexte (cycle + phase) — permet de ré-afficher quand le contexte change. */
  contextHash?: string
  /** Action optionnelle sous le résumé (ex. passer les semaines récup inter-saison). */
  summaryFooterAction?: {
    label: string
    onClick: () => void
    testId?: string
  }
  /** Langue pour les libellés UI locaux. */
  lang?: 'fr' | 'en'
}

/**
 * Carte contexte hebdo — fond encre, glow doré, typo éditoriale.
 * « Pourquoi ? » déplie le détail inline (plus de pastille coach globale).
 * Lien optionnel vers `/chat` pour une question libre.
 */
export function PlanningContextCard({
  explanation,
  weekLabel,
  hideCorrections = false,
  contextHash,
  summaryFooterAction,
  lang = 'fr',
}: PlanningContextCardProps) {
  const summaryId = useId()
  const { visible, dismiss } = useHintVisibility('planning_context_card', {
    cooldownDays: 14,
    contextHash,
  })
  const dismissAfterExitRef = useRef(false)
  const [panelOpen, setPanelOpen] = useState(visible)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const prevVisibleRef = useRef(visible)

  useEffect(() => {
    const prev = prevVisibleRef.current
    prevVisibleRef.current = visible

    if (!visible) return

    if (prev !== false) return

    const id = window.setTimeout(() => setPanelOpen(true), 0)
    return () => window.clearTimeout(id)
  }, [visible])

  const visibleCorrections = hideCorrections ? [] : explanation.corrections
  const detailTexts = [
    ...explanation.detailLines,
    ...visibleCorrections,
  ].filter(Boolean)
  const hasDetails = detailTexts.length > 0
  const hasActions = hasDetails || Boolean(summaryFooterAction)
  const chatSeed =
    weekLabel != null
      ? lang === 'en'
        ? `I'm in ${weekLabel}. `
        : `Je suis en ${weekLabel}. `
      : undefined

  const requestDismiss = () => {
    dismissAfterExitRef.current = true
    setPanelOpen(false)
  }

  const handleExitComplete = () => {
    if (dismissAfterExitRef.current) {
      dismissAfterExitRef.current = false
      dismiss()
    }
  }

  if (!visible && !panelOpen) return null

  const dividerStyle = { borderTop: '1px solid rgb(245 242 238 / 0.15)' } as const

  return (
    <AnimatePresence initial={false} mode="sync" onExitComplete={handleExitComplete}>
      {panelOpen && visible ? (
        <motion.section
          key="planning-context-card"
          role="region"
          aria-labelledby={summaryId}
          layout={false}
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.97 }}
          transition={{ duration: 0.22, ease: CARD_EASE }}
          className="relative overflow-hidden rounded-[20px] text-app rf-focus-ring"
          style={{
            background: 'linear-gradient(135deg, var(--color-text-primary) 0%, #2A1820 100%)',
          }}
          data-testid="planning-context-card"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-10 -right-10 h-[180px] w-[180px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgb(184 137 58 / 0.28), transparent 70%)',
            }}
          />

          <div className="relative px-[22px] pb-5 pt-5">
            <button
              type="button"
              onClick={requestDismiss}
              className="absolute right-3 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-xl text-app/55 transition-colors hover:bg-white/10 hover:text-app rf-focus-ring sm:right-[18px] sm:top-[18px]"
              aria-label={lang === 'en' ? 'Hide this information' : 'Masquer cette information'}
              title={
                lang === 'en'
                  ? 'Hide (comes back on next phase change or after 14 days)'
                  : 'Masquer (réapparaît au prochain changement de phase ou après 14 jours)'
              }
              data-testid="planning-context-dismiss"
            >
              <X className="h-4 w-4" strokeWidth={2.25} />
            </button>

            <div className="pr-10 sm:pr-11">
              {weekLabel ? (
                <span
                  className="inline-flex max-w-full items-center gap-1 rounded px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-fg"
                  style={{ background: 'var(--color-gold)' }}
                >
                  <Sparkles className="h-2.5 w-2.5 shrink-0" strokeWidth={2.4} aria-hidden />
                  <span className="truncate">{weekLabel}</span>
                </span>
              ) : null}

              <p
                id={summaryId}
                className={`font-serif italic font-medium leading-snug [text-wrap:balance] text-app ${
                  weekLabel ? 'mt-2.5' : 'mt-0.5'
                }`}
                style={{ fontSize: 16, letterSpacing: '-0.25px' }}
              >
                {explanation.summaryLine}
              </p>
            </div>

            {hasDetails && detailsOpen ? (
              <ul
                className="mt-3 space-y-2 text-[12px] font-medium leading-relaxed text-app/75"
                data-testid="planning-context-details"
              >
                {detailTexts.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-pro/80" aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            {hasActions ? (
              <div
                className="mt-[18px] flex flex-col gap-2 pt-3.5 sm:flex-row sm:flex-wrap sm:items-stretch"
                style={dividerStyle}
              >
                {hasDetails ? (
                  <button
                    type="button"
                    onClick={() => setDetailsOpen((v) => !v)}
                    data-testid="planning-context-toggle"
                    aria-expanded={detailsOpen}
                    aria-label={
                      lang === 'en' ? 'Show why this program' : 'Voir pourquoi ce programme'
                    }
                    className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-center text-xs font-bold text-pro shadow-[inset_0_1px_0_rgb(255_255_255/0.06)] transition-colors hover:border-pro/35 hover:bg-white/10 sm:min-h-[40px] sm:flex-none sm:px-5"
                  >
                    {lang === 'en' ? 'Why?' : 'Pourquoi ?'}
                    <ChevronDown
                      className={`h-3.5 w-3.5 shrink-0 opacity-90 transition-transform ${
                        detailsOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden
                      strokeWidth={2.4}
                    />
                  </button>
                ) : null}

                <Link
                  to={chatSeed ? `/chat?seed=${encodeURIComponent(chatSeed)}` : '/chat'}
                  data-testid="planning-context-ask-coach"
                  className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-white/12 bg-transparent px-4 py-2.5 text-center text-xs font-bold text-app/90 transition-colors hover:border-white/22 hover:bg-white/[0.06] sm:min-h-[40px] sm:flex-none sm:px-5"
                >
                  <MessageCircle className="h-3.5 w-3.5 shrink-0 opacity-95" aria-hidden />
                  {lang === 'en' ? 'Ask the coach' : 'Demander au coach'}
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden strokeWidth={2.4} />
                </Link>

                {summaryFooterAction ? (
                  <button
                    type="button"
                    onClick={summaryFooterAction.onClick}
                    data-testid={summaryFooterAction.testId ?? 'planning-context-footer-action'}
                    className={`inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-white/12 bg-transparent px-4 py-2.5 text-center text-[11px] font-bold leading-snug text-app/90 transition-colors [text-wrap:balance] hover:border-white/22 hover:bg-white/[0.06] sm:min-h-[40px] sm:flex-none sm:px-4 ${hasDetails ? 'sm:max-w-md' : ''}`}
                  >
                    {summaryFooterAction.label}
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="mt-[18px] pt-3.5" style={dividerStyle}>
                <Link
                  to={chatSeed ? `/chat?seed=${encodeURIComponent(chatSeed)}` : '/chat'}
                  data-testid="planning-context-ask-coach"
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-white/12 bg-transparent px-4 py-2.5 text-center text-xs font-bold text-app/90 transition-colors hover:border-white/22 hover:bg-white/[0.06]"
                >
                  <MessageCircle className="h-3.5 w-3.5 shrink-0 opacity-95" aria-hidden />
                  {lang === 'en' ? 'Ask the coach' : 'Demander au coach'}
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden strokeWidth={2.4} />
                </Link>
              </div>
            )}
          </div>
        </motion.section>
      ) : null}
    </AnimatePresence>
  )
}
