import { motion, AnimatePresence } from 'framer-motion'
import { X, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'

interface PremiumSheetProps {
  isOpen: boolean
  onClose: () => void
  /** Titre court de la fonctionnalité verrouillée (ex. "Suivi des charges"). */
  feature: string
  /** Description courte du bénéfice. */
  benefit: string
  /** Destination du CTA Premium — défaut : la section #premium du Profil. */
  ctaHref?: string
  /** Libellé du bouton secondaire — défaut : "Plus tard". */
  skipLabel?: string
}

/**
 * Bottom sheet contextuelle — s'affiche au moment où un user free tente une action premium.
 * Alternative aux encarts plantés qui saturent l'écran.
 */
export function PremiumSheet({
  isOpen,
  onClose,
  feature,
  benefit,
  ctaHref = '/profile#premium',
  skipLabel = 'Plus tard',
}: PremiumSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={feature}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed bottom-0 left-0 right-0 bg-panel rounded-t-[2rem] p-6 pb-8 z-50 max-w-md mx-auto shadow-[0_-8px_32px_rgb(44_24_16/0.18)]"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-soft flex items-center justify-center">
                  <Lock className="w-5 h-5 text-brand-tint" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-fg-muted">Premium</p>
                  <h3 className="text-lg font-black text-fg leading-tight">{feature}</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-fg-muted hover:bg-layer-10 rf-focus-ring"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-fg-secondary leading-relaxed mb-5">{benefit}</p>

            <div className="flex flex-col gap-2">
              <Link
                to={ctaHref}
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl bg-brand hover:bg-brand-hover transition-colors text-center"
              >
                <span className="text-sm font-black text-on-brand tracking-wide">
                  Découvrir Premium — 5,99€/mois
                </span>
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 text-sm font-bold text-fg-muted hover:text-fg transition-colors rf-focus-ring rounded-2xl"
              >
                {skipLabel}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
