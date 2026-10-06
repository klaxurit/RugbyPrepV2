import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Share, X } from 'lucide-react'
import { useEscapeAndScrollLock } from '../../hooks/useEscapeAndScrollLock'

interface SheetProps {
  open: boolean
  onClose: () => void
}

/**
 * Bottom sheet: instructions to add RugbyForge to the iOS home screen (PWA).
 * Portaled to document.body so landing navbar backdrop-filter does not clip it.
 */
export function IosInstallSheet({ open, onClose }: SheetProps) {
  useEscapeAndScrollLock(open, onClose)

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] backdrop-blur-md"
            style={{ background: 'rgb(44 24 16 / 0.6)' }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Installer RugbyForge sur iOS"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:max-w-md bottom-[calc(12px+env(safe-area-inset-bottom))] z-[110] rounded-3xl p-5"
            style={{
              background: '#FFFFFF',
              border: '1px solid rgb(44 24 16 / 0.08)',
              boxShadow:
                '0 -12px 40px rgb(44 24 16 / 0.18), 0 -4px 12px rgb(123 13 30 / 0.08)',
            }}
          >
            <div
              className="mx-auto mb-3 h-1 w-10 rounded-full sm:hidden"
              style={{ background: 'rgb(44 24 16 / 0.12)' }}
            />

            <SheetHeader
              title="Installer sur iPhone"
              subtitle="Ajoute RugbyForge à ton écran d'accueil. Aucun App Store, aucun téléchargement."
              onClose={onClose}
            />

            <ol className="mt-5 space-y-3">
              <Step
                num={1}
                text={
                  <>
                    Touche{' '}
                    <IconBox label="Bouton Partager">
                      <Share
                        className="w-3.5 h-3.5"
                        style={{ color: '#7B0D1E' }}
                        strokeWidth={2}
                      />
                    </IconBox>{' '}
                    en bas de Safari
                  </>
                }
              />
              <Step
                num={2}
                text={
                  <>
                    Sélectionne{' '}
                    <IconBox>
                      <Plus
                        className="w-3.5 h-3.5"
                        style={{ color: '#7B0D1E' }}
                        strokeWidth={2.5}
                      />
                    </IconBox>{' '}
                    <strong className="font-semibold">Sur l'écran d'accueil</strong>
                  </>
                }
              />
              <Step
                num={3}
                text={
                  <>
                    Tape <strong className="font-semibold">Ajouter</strong>. L'icône
                    RugbyForge apparaît sur ton iPhone.
                  </>
                }
              />
            </ol>

            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full py-3 rounded-xl text-sm font-semibold transition-colors"
              style={{ color: '#5A4838', background: '#F5F2EE' }}
            >
              J'ai compris
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}

function SheetHeader({
  title,
  subtitle,
  onClose,
}: {
  title: string
  subtitle: string
  onClose: () => void
}) {
  return (
    <div className="flex items-start gap-3">
      <img
        src="/icons/icon-192.png"
        alt=""
        aria-hidden
        width={48}
        height={48}
        className="flex-none w-12 h-12 rounded-2xl"
        style={{ boxShadow: '0 4px 12px rgb(123 13 30 / 0.25)' }}
      />
      <div className="flex-1 min-w-0">
        <p
          className="text-base font-bold leading-tight tracking-tight"
          style={{ color: '#2C1810' }}
        >
          {title}
        </p>
        <p className="text-sm leading-snug mt-0.5" style={{ color: '#8A7A6A' }}>
          {subtitle}
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
        className="flex-none w-8 h-8 rounded-full grid place-items-center transition-colors"
        style={{ color: '#8A7A6A' }}
      >
        <X className="w-4 h-4" strokeWidth={2.5} />
      </button>
    </div>
  )
}

function IconBox({
  children,
  label,
}: {
  children: React.ReactNode
  label?: string
}) {
  return (
    <span
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className="inline-grid place-items-center align-middle w-7 h-7 mx-1 rounded-md"
      style={{ background: '#F5F2EE', border: '1px solid rgb(44 24 16 / 0.08)' }}
    >
      {children}
    </span>
  )
}

function Step({ num, text }: { num: number; text: React.ReactNode }) {
  return (
    <li
      className="flex items-start gap-3 text-sm leading-relaxed"
      style={{ color: '#2C1810' }}
    >
      <span
        aria-hidden
        className="flex-none mt-0.5 w-6 h-6 rounded-full text-xs font-bold grid place-items-center"
        style={{ background: '#7B0D1E', color: '#F5F2EE' }}
      >
        {num}
      </span>
      <span className="flex-1">{text}</span>
    </li>
  )
}
