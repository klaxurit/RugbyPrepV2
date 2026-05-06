import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

export interface BottomSheetProps {
  open: boolean
  onClose: () => void
  /** Étiquette accessibilité du dialog. */
  ariaLabel: string
  /** Pré-titre fin (uppercase tracking) — ex. "Séance terminée". */
  eyebrow?: string
  /** Titre principal — ex. "Bas du corps · Hypertrophie". */
  title?: string
  /** Bouton de fermeture visible (par défaut true). */
  showClose?: boolean
  /** Désactive le swipe-down dismiss (cas formulaire à compléter forcé). */
  disableSwipeDismiss?: boolean
  /** Désactive le tap-backdrop dismiss. */
  disableBackdropDismiss?: boolean
  /** Largeur max du panel (défaut: max-w-md). */
  maxWidthClass?: string
  /** Si true : pas de header eyebrow/title rendu (juste handle + X flottant).
   *  Le children est responsable de son propre header visuel. */
  hideDefaultHeader?: boolean
  children: ReactNode
}

/**
 * Bottom sheet primitive — animation slide-up + drag handle + backdrop +
 * swipe-down dismiss. Z-index au-dessus de la BottomNav.
 *
 * Utilisé pour : finition de séance, kebab actions, picker contextuel.
 * Le contenu (children) est libre — la primitive ne s'occupe que de la
 * coque (header + drag handle + animations + safe-area).
 */
export function BottomSheet({
  open,
  onClose,
  ariaLabel,
  eyebrow,
  title,
  showClose = true,
  disableSwipeDismiss = false,
  disableBackdropDismiss = false,
  maxWidthClass = 'max-w-md',
  hideDefaultHeader = false,
  children,
}: BottomSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="bs-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={disableBackdropDismiss ? undefined : onClose}
            aria-hidden
            className="fixed inset-0 z-[55] bg-black/40"
          />
          <motion.div
            key="bs-panel"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            drag={disableSwipeDismiss ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (disableSwipeDismiss) return
              if (info.offset.y > 80 || info.velocity.y > 400) onClose()
            }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            className={`fixed bottom-0 left-0 right-0 z-[60] mx-auto ${maxWidthClass} rounded-t-3xl border-t border-x border-border-app bg-panel pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 shadow-elevated max-h-[92vh] overflow-y-auto`}
          >
            <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-layer-15" />
            {!hideDefaultHeader && (
              <div className="flex items-center gap-2 px-4 pb-2">
                <div className="min-w-0 flex-1">
                  {eyebrow && (
                    <p className="text-[10px] font-bold uppercase tracking-wider text-fg-muted leading-none">
                      {eyebrow}
                    </p>
                  )}
                  {title && (
                    <p className="mt-1 truncate text-sm font-black text-fg leading-tight">
                      {title}
                    </p>
                  )}
                </div>
                {showClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Fermer"
                    className="rounded-xl p-2 text-fg-muted hover:bg-layer-7 rf-focus-ring"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
            {hideDefaultHeader && showClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-app/80 text-fg backdrop-blur rf-focus-ring"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <div className={hideDefaultHeader ? '' : 'px-4 pb-3'}>{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
