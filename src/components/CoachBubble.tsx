import { useCallback, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Info, X, Zap } from 'lucide-react'
import compagnonClosed from '../assets/compagnon-mouth-closed.png'
import compagnonOpen from '../assets/compagnon-mouth-open.png'

/**
 * Bulle coach — pattern "trombone" moderne. Icône sticky top-right, badge
 * pulsant quand des messages sont dispo, popover au clic avec les conseils
 * liés à la phase courante du programme.
 *
 * Contenu agrégé : phase courante + info programme (ex-warnings) + conditionnement
 * compagnon. Les alertes critiques (ACWR danger, rehab) restent en bannière
 * dédiée — elles ne transitent pas par la bulle.
 *
 * Dismiss : scoped à la semaine (`weekId`). Après première ouverture, le badge
 * disparaît ; la bulle reste cliquable. Nouvelle semaine = nouveau badge.
 */
interface CoachBubbleProps {
  weekId: string
  phaseLabel?: string
  infoMessages?: string[]
  companionMessages?: string[]
}

const STORAGE_PREFIX = 'rugbyforge.coachbubble.seen'

function isSeen(weekId: string): boolean {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}.${weekId}`) === '1'
  } catch {
    return false
  }
}

function markSeen(weekId: string) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}.${weekId}`, '1')
  } catch { /* ignore */ }
}

export function CoachBubble({
  weekId,
  phaseLabel,
  infoMessages = [],
  companionMessages = [],
}: CoachBubbleProps) {
  const [open, setOpen] = useState(false)
  const [seenCount, setSeenCount] = useState(0) // force re-render after markSeen
  void seenCount

  const hasContent = infoMessages.length > 0 || companionMessages.length > 0 || Boolean(phaseLabel)
  const messageCount = infoMessages.length + companionMessages.length
  const showBadge = useMemo(
    () => hasContent && messageCount > 0 && !isSeen(weekId),
    // seenCount triggers re-eval after markSeen (localStorage not reactive)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasContent, messageCount, weekId, seenCount],
  )

  const handleOpen = useCallback(() => {
    setOpen(true)
    markSeen(weekId)
    setSeenCount((n) => n + 1)
  }, [weekId])

  const handleClose = useCallback(() => setOpen(false), [])

  if (!hasContent) return null

  return (
    // Flottant au-dessus du contenu, positionné juste sous le PageHeader (sticky top-0 z-50,
    // hauteur ~88px). z-40 pour passer au-dessus des bannières sans couvrir le header.
    <div className="fixed top-24 right-4 z-40">
      <div className="relative">
        {/* Bubble trigger — mascotte custom (bouche fermée / ouverte selon état). */}
        <button
          type="button"
          onClick={open ? handleClose : handleOpen}
          aria-label={open ? 'Fermer les conseils du coach' : `Voir les conseils du coach${messageCount > 0 ? ` — ${messageCount} message${messageCount > 1 ? 's' : ''}` : ''}`}
          aria-expanded={open}
          className="w-14 h-14 rounded-full overflow-hidden bg-brand-soft shadow-lg hover:scale-105 active:scale-95 transition-transform rf-focus-ring"
          data-testid="coach-bubble-trigger"
        >
          <img
            src={open ? compagnonOpen : compagnonClosed}
            alt=""
            aria-hidden
            className="w-full h-full object-contain"
            draggable={false}
          />
        </button>

        {/* Badge count — only until first open for this week */}
        {showBadge && !open && (
          <span
            aria-hidden
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-alert text-white text-[10px] font-black leading-none flex items-center justify-center shadow animate-pulse"
          >
            {messageCount}
          </span>
        )}

        {/* Popover */}
        <AnimatePresence>
          {open && (
            <motion.div
              key="coach-popover"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              role="dialog"
              aria-label="Conseils du coach"
              className="absolute top-16 right-0 w-[17rem] max-w-[calc(100vw-2rem)] rounded-[20px] border border-border-app bg-panel shadow-xl p-4 space-y-3"
              data-testid="coach-bubble-popover"
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
