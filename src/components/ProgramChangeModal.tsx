import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, ArrowRight, Info, Sparkles, X } from 'lucide-react'
import type { VisibleProgramChangeNotice } from '../types/programChange'

const ICON_BY_TYPE = {
  cycle: Sparkles,
  phase: ArrowRight,
  acwr: AlertTriangle,
  match: Info,
} as const

const ACCENT_BY_SEVERITY = {
  info: {
    bg: 'bg-brand-soft',
    border: 'border-brand-border',
    icon: 'text-brand-tint',
  },
  warning: {
    bg: 'bg-warn-bg-muted',
    border: 'border-warn-bd',
    icon: 'text-warn-strong',
  },
  critical: {
    bg: 'bg-alert-bg-muted',
    border: 'border-alert-bd',
    icon: 'text-alert',
  },
} as const

interface ProgramChangeModalProps {
  notice: VisibleProgramChangeNotice
  onAcknowledge: () => void
  onPostpone: () => void
}

export function ProgramChangeModal({ notice, onAcknowledge, onPostpone }: ProgramChangeModalProps) {
  const Icon = ICON_BY_TYPE[notice.type]
  const accent = ACCENT_BY_SEVERITY[notice.severity]

  return (
    <AnimatePresence>
      <motion.div
        key="program-change-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="program-change-title"
      >
        <motion.section
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="w-full sm:max-w-md bg-app border border-border-app rounded-t-[24px] sm:rounded-[24px] p-5 space-y-5 shadow-brand-float"
          data-testid="program-change-modal"
        >
          <header className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl border ${accent.bg} ${accent.border}`}>
              <Icon className={`w-5 h-5 ${accent.icon}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-fg-muted">
                Ton programme évolue
              </p>
              <h2 id="program-change-title" className="text-lg font-black text-fg leading-tight mt-0.5">
                {notice.title}
              </h2>
            </div>
          </header>

          <p className="text-sm text-fg-soft leading-relaxed">{notice.summary}</p>

          {notice.bullets.length > 0 && (
            <ul className="space-y-2 text-xs text-fg-soft">
              {notice.bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand flex-none" aria-hidden />
                  <span className="leading-snug">{bullet}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              onClick={onAcknowledge}
              data-testid="program-change-acknowledge"
              className="py-3 rounded-2xl bg-brand text-on-brand text-sm font-black uppercase tracking-wide hover:bg-brand-hover transition-colors rf-focus-ring"
            >
              C'est compris, on y va
            </button>
            {notice.canPostponeNow && (
              <button
                type="button"
                onClick={onPostpone}
                data-testid="program-change-postpone"
                className="py-3 rounded-2xl border border-border-app bg-layer-5 text-xs font-bold text-fg-soft hover:border-layer-20 transition-colors rf-focus-ring inline-flex items-center justify-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                Reporter d'une semaine
              </button>
            )}
            {!notice.canPostponeNow && notice.postponable && (
              <p className="text-[11px] text-fg-muted text-center">
                Tu as déjà reporté ce changement la semaine dernière.
              </p>
            )}
          </div>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  )
}
