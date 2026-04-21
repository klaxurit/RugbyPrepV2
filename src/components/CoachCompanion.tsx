import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Info, MessageCircle, X, Zap } from 'lucide-react'
import { useCoachContext } from '../contexts/CoachContext'
import { useProfile } from '../hooks/useProfile'
import { getPositionIllustration } from '../assets/positions'
import compagnonClosed from '../assets/compagnon-mouth-closed.png'
import compagnonOpen from '../assets/compagnon-mouth-open.png'

const STORAGE_PREFIX = 'rugbyforge.coachcompanion.seen'

function isSeen(scopeKey: string): boolean {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}.${scopeKey}`) === '1'
  } catch {
    return false
  }
}

function markSeen(scopeKey: string) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}.${scopeKey}`, '1')
  } catch { /* ignore */ }
}

/**
 * Compagnon global — FAB bottom-right, lit son contexte via useCoachContext().
 * Monté une seule fois au niveau racine ; chaque page enregistre son contexte
 * via useRegisterCoachContext. Invisible tant qu'aucune page n'a publié de
 * contenu.
 */
export function CoachCompanion() {
  const { ctx } = useCoachContext()
  const { profile } = useProfile()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [seenCount, setSeenCount] = useState(0)
  void seenCount

  // Illustration du poste en priorité, fallback mascotte si pas encore de profil.
  const positionIllustration = getPositionIllustration(profile.rugbyPosition ?? profile.position)
  const avatarSrc = positionIllustration ?? (open ? compagnonOpen : compagnonClosed)

  const infoMessages = ctx?.infoMessages ?? []
  const companionMessages = ctx?.companionMessages ?? []
  const phaseLabel = ctx?.phaseLabel
  const scopeKey = ctx?.scopeKey ?? ''
  const chatSeed = ctx?.chatSeed

  const hasContent =
    infoMessages.length > 0 || companionMessages.length > 0 || Boolean(phaseLabel)
  const messageCount = infoMessages.length + companionMessages.length

  const showBadge = useMemo(
    () => hasContent && messageCount > 0 && scopeKey !== '' && !isSeen(scopeKey),
    // seenCount re-triggers eval after markSeen (localStorage non-reactive)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasContent, messageCount, scopeKey, seenCount],
  )

  const handleOpen = useCallback(() => {
    setOpen(true)
    if (scopeKey) {
      markSeen(scopeKey)
      setSeenCount((n) => n + 1)
    }
  }, [scopeKey])

  const handleClose = useCallback(() => setOpen(false), [])

  const handleAskQuestion = useCallback(() => {
    const seed = chatSeed ?? phaseLabel ?? ''
    setOpen(false)
    navigate(seed ? `/chat?seed=${encodeURIComponent(seed)}` : '/chat')
  }, [chatSeed, phaseLabel, navigate])

  if (!hasContent) return null

  return (
    <div
      className="fixed right-4 z-40"
      style={{
        bottom: 'max(6rem, calc(env(safe-area-inset-bottom, 0px) + 6rem))',
      }}
    >
      <div className="relative">
        <button
          type="button"
          onClick={open ? handleClose : handleOpen}
          aria-label={
            open
              ? 'Fermer les conseils du coach'
              : `Voir les conseils du coach${messageCount > 0 ? ` — ${messageCount} message${messageCount > 1 ? 's' : ''}` : ''}`
          }
          aria-expanded={open}
          className="w-14 h-14 rounded-full overflow-hidden bg-brand-soft shadow-lg hover:scale-105 active:scale-95 transition-transform rf-focus-ring"
          data-testid="coach-companion-trigger"
        >
          <img
            src={avatarSrc}
            alt=""
            aria-hidden
            className="w-full h-full object-contain"
            draggable={false}
          />
        </button>

        {showBadge && !open && (
          <span
            aria-hidden
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-alert text-white text-[10px] font-black leading-none flex items-center justify-center shadow animate-pulse"
          >
            {messageCount}
          </span>
        )}

        <AnimatePresence>
          {open && (
            <motion.div
              key="coach-popover"
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              role="dialog"
              aria-label="Conseils du coach"
              className="absolute bottom-16 right-0 w-[17rem] max-w-[calc(100vw-2rem)] rounded-[20px] border border-border-app bg-panel shadow-xl p-4 space-y-3"
              data-testid="coach-companion-popover"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-brand-tint">
                    Ton coach
                  </p>
                  {phaseLabel && (
                    <p className="text-xs font-bold text-fg mt-0.5">{phaseLabel}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  aria-label="Fermer"
                  className="p-1 rounded-full text-fg-muted hover:text-fg hover:bg-layer-10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {infoMessages.length > 0 && (
                <section className="rounded-2xl border border-info-bd bg-info-bg px-3 py-2.5 space-y-1.5">
                  <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-info">
                    <Info className="w-3.5 h-3.5" aria-hidden />
                    Info programme
                  </p>
                  <ul className="space-y-1 text-xs text-fg-secondary leading-snug">
                    {infoMessages.map((m) => <li key={m}>{m}</li>)}
                  </ul>
                </section>
              )}

              {companionMessages.length > 0 && (
                <section className="rounded-2xl border border-brand-border bg-brand-soft px-3 py-2.5 space-y-1.5">
                  <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-brand-tint">
                    <Zap className="w-3.5 h-3.5" aria-hidden />
                    Conditionnement compagnon
                  </p>
                  <ul className="space-y-1 text-xs text-fg-emphasis leading-snug">
                    {companionMessages.map((m) => <li key={m}>· {m}</li>)}
                  </ul>
                </section>
              )}

              <button
                type="button"
                onClick={handleAskQuestion}
                className="w-full rounded-xl border border-brand-border bg-brand px-3 py-2.5 text-white text-sm font-semibold hover:bg-brand-dark transition-colors flex items-center justify-center gap-1.5 rf-focus-ring"
                data-testid="coach-companion-ask"
              >
                <MessageCircle className="w-4 h-4" aria-hidden />
                Poser une question
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
