import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  Check,
  Copy,
  Download,
  Plus,
  Share,
  Smartphone,
  X,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../services/supabase/client'

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=fr.rugbyforge.app'

type Platform = 'desktop' | 'ios' | 'android'

interface Props {
  className?: string
  forcePlatform?: Platform
  desktopLabel?: string
  withArrow?: boolean
  onSignupClick?: () => void
}

interface BeforeInstallPromptEvent extends Event {
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
  prompt(): Promise<void>
}

function detectPlatform(forcePlatform?: Platform): Platform {
  if (forcePlatform) return forcePlatform
  if (typeof window === 'undefined') return 'desktop'

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  if (isStandalone) return 'desktop'

  const ua = navigator.userAgent
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) &&
    !(window as unknown as { MSStream?: unknown }).MSStream
  if (isIOS) return 'ios'

  const isAndroid = /Android/.test(ua)
  if (isAndroid) return 'android'

  return 'desktop'
}

export function SignupOrInstallCTA({
  className = '',
  forcePlatform,
  desktopLabel = 'Commencer gratuitement',
  withArrow = false,
  onSignupClick,
}: Props) {
  const [platform] = useState<Platform>(() => detectPlatform(forcePlatform))
  const [, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [iosSheetOpen, setIosSheetOpen] = useState(false)
  const [desktopSheetOpen, setDesktopSheetOpen] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleClick = () => {
    onSignupClick?.()
    if (platform === 'ios') {
      setIosSheetOpen(true)
      return
    }
    if (platform === 'android') {
      window.location.href = PLAY_STORE_URL
      return
    }
    setDesktopSheetOpen(true)
  }

  const label =
    platform === 'ios'
      ? 'Ajouter à l’écran d’accueil'
      : platform === 'android'
        ? 'Télécharger sur Google Play'
        : desktopLabel

  const Icon =
    platform === 'ios' ? Smartphone : platform === 'android' ? Download : null

  return (
    <>
      <button type="button" onClick={handleClick} className={className}>
        {Icon && <Icon className="w-5 h-5" />}
        {label}
        {withArrow && platform === 'desktop' && <ArrowRight className="w-5 h-5" />}
      </button>

      <IosInstallSheet open={iosSheetOpen} onClose={() => setIosSheetOpen(false)} />
      <DesktopHandoffSheet
        open={desktopSheetOpen}
        onClose={() => setDesktopSheetOpen(false)}
      />
    </>
  )
}

// ─── iOS : bottom sheet "Ajouter à l'écran d'accueil" ──────────────────────

interface SheetProps {
  open: boolean
  onClose: () => void
}

function IosInstallSheet({ open, onClose }: SheetProps) {
  useEscapeAndScrollLock(open, onClose)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] backdrop-blur-sm"
            style={{ background: 'rgb(44 24 16 / 0.4)' }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Installer RugbyForge sur iOS"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:max-w-md bottom-[calc(12px+env(safe-area-inset-bottom))] z-[80] rounded-3xl p-5"
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
    </AnimatePresence>
  )
}

// ─── Desktop : modale centrée QR + email ────────────────────────────────

function DesktopHandoffSheet({ open, onClose }: SheetProps) {
  const [copied, setCopied] = useState(false)
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const url = useMemo(
    () => (typeof window !== 'undefined' ? window.location.origin : ''),
    [],
  )
  const host = useMemo(
    () => (typeof window !== 'undefined' ? window.location.host : ''),
    [],
  )

  useEscapeAndScrollLock(open, onClose)

  const handleCopy = async () => {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* noop */
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const { error: insertError } = await supabase
        .from('mobile_install_leads')
        .insert({ email: email.toLowerCase().trim(), user_agent: navigator.userAgent })
      if (insertError) throw insertError
      setSubmitted(true)
    } catch {
      setError("Impossible d'envoyer pour le moment. Réessaie ou copie le lien.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] backdrop-blur-sm"
            style={{ background: 'rgb(44 24 16 / 0.4)' }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Continuer sur mobile"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[80] w-[min(440px,calc(100vw-32px))] max-h-[90vh] overflow-y-auto rounded-3xl p-6"
            style={{
              background: '#FFFFFF',
              border: '1px solid rgb(44 24 16 / 0.08)',
              boxShadow:
                '0 24px 60px rgb(44 24 16 / 0.18), 0 8px 16px rgb(123 13 30 / 0.08)',
            }}
          >
            <SheetHeader
              title="RugbyForge est conçu pour le terrain"
              subtitle="Scanne le QR code ou reçois le lien par email — l'app s'installe en 10 secondes sur ton téléphone."
              onClose={onClose}
            />

            <div className="mt-5 flex justify-center">
              <div
                className="rounded-2xl p-4"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgb(44 24 16 / 0.08)',
                }}
              >
                {url ? (
                  <QRCodeSVG
                    value={url}
                    size={200}
                    fgColor="#7B0D1E"
                    bgColor="#FFFFFF"
                    level="M"
                  />
                ) : (
                  <div
                    className="w-[200px] h-[200px] rounded-md animate-pulse"
                    style={{ background: '#F5F2EE' }}
                  />
                )}
              </div>
            </div>

            <div
              className="mt-5 flex items-center gap-2 rounded-xl p-2 pl-3"
              style={{
                background: '#F5F2EE',
                border: '1px solid rgb(44 24 16 / 0.08)',
              }}
            >
              <span
                className="flex-1 truncate text-sm font-medium"
                style={{ color: '#2C1810' }}
              >
                {host || '…'}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
                style={{
                  background: copied ? '#7B0D1E' : '#FFFFFF',
                  color: copied ? '#F5F2EE' : '#7B0D1E',
                  border: '1px solid rgb(123 13 30 / 0.15)',
                }}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                    Copié
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" strokeWidth={2} />
                    Copier
                  </>
                )}
              </button>
            </div>

            <div
              className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider"
              style={{ color: '#8A7A6A' }}
            >
              <div
                className="flex-1 h-px"
                style={{ background: 'rgb(44 24 16 / 0.08)' }}
              />
              ou
              <div
                className="flex-1 h-px"
                style={{ background: 'rgb(44 24 16 / 0.08)' }}
              />
            </div>

            {submitted ? (
              <div
                className="rounded-xl p-4 text-sm text-center"
                style={{
                  background: 'rgb(123 13 30 / 0.06)',
                  color: '#2C1810',
                }}
              >
                <Check
                  className="w-5 h-5 mx-auto mb-1"
                  style={{ color: '#7B0D1E' }}
                  strokeWidth={2.5}
                />
                Lien envoyé ! Vérifie ta boîte mail sur ton téléphone pour installer RugbyForge.
              </div>
            ) : (
              <form onSubmit={handleEmailSubmit} className="space-y-2">
                <label
                  htmlFor="install-email"
                  className="block text-xs font-semibold"
                  style={{ color: '#5A4838' }}
                >
                  Reçois le lien sur ton téléphone
                </label>
                <div className="flex gap-2">
                  <input
                    id="install-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ton@email.com"
                    className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors"
                    style={{
                      background: '#F5F2EE',
                      border: '1px solid rgb(44 24 16 / 0.08)',
                      color: '#2C1810',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={submitting || !email}
                    className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
                    style={{
                      background: '#7B0D1E',
                      color: '#FFFFFF',
                    }}
                  >
                    {submitting ? '…' : 'Envoyer'}
                  </button>
                </div>
                {error && (
                  <p className="text-xs" style={{ color: '#7B0D1E' }}>
                    {error}
                  </p>
                )}
              </form>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function useEscapeAndScrollLock(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])
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
      <div
        aria-hidden
        className="flex-none w-12 h-12 rounded-2xl grid place-items-center text-white font-bold text-base tracking-tight"
        style={{
          background: 'linear-gradient(135deg, #7B0D1E 0%, #5E0A17 100%)',
          boxShadow: '0 4px 12px rgb(123 13 30 / 0.25)',
        }}
      >
        RF
      </div>
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
