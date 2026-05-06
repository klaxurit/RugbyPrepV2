import { useEffect, useRef, useState } from 'react'
import { useSessionRun } from '../../../contexts/SessionRunContext'
import { useRestBeepPref } from '../../../hooks/useRestBeepPref'
import { playRestEndBeep } from '../../../utils/audioBeep'
import { vibrate } from '../../../utils/vibrate'
import { Icon } from '../../ui'

/**
 * Overlay countdown du repos entre tours — design éditorial v4-pro.
 *
 * Branchée sur `sessionRun.restTimer` (state global). Affiche le countdown,
 * une barre de progression, un bouton "Passer" qui appelle `skipRestTimer()`.
 *
 * À la fin du timer (endsAt) :
 *  - vibrate `[120, 80, 120]` (pattern "fini")
 *  - beep audio (si `useRestBeepPref.enabled`)
 *  - 800 ms après → `skipRestTimer()` automatique (auto-dismiss)
 *
 * Visible uniquement quand `restTimer != null`. Le composant est positionné
 * par le parent (sticky bottom).
 */
export function RestOverlay() {
  const { restTimer, skipRestTimer } = useSessionRun()
  const { enabled: beepEnabled } = useRestBeepPref()
  const [now, setNow] = useState(() => Date.now())

  // Refs : on capture les callbacks pour que l'effet d'auto-dismiss ne dépende
  // que de la *référence* du restTimer (pas de chaque tick du now).
  const skipRef = useRef(skipRestTimer)
  const beepRef = useRef(beepEnabled)
  useEffect(() => {
    skipRef.current = skipRestTimer
  }, [skipRestTimer])
  useEffect(() => {
    beepRef.current = beepEnabled
  }, [beepEnabled])

  // Ticker 200 ms pour rafraîchir l'affichage tant que le timer tourne.
  useEffect(() => {
    if (!restTimer) return
    const id = window.setInterval(() => setNow(Date.now()), 200)
    return () => window.clearInterval(id)
  }, [restTimer])

  // Auto-dismiss : 2 setTimeout absolus (beep à endsAt, skip à endsAt+800ms).
  // Volontairement indépendant du tick — sinon le cleanup à chaque tick
  // tuerait le setTimeout avant qu'il ne fire.
  useEffect(() => {
    if (!restTimer) return
    const beepDelay = Math.max(0, restTimer.endsAt - Date.now())
    const dismissDelay = beepDelay + 800
    const beepId = window.setTimeout(() => {
      vibrate([120, 80, 120])
      if (beepRef.current) playRestEndBeep()
    }, beepDelay)
    const dismissId = window.setTimeout(() => {
      skipRef.current()
    }, dismissDelay)
    return () => {
      window.clearTimeout(beepId)
      window.clearTimeout(dismissId)
    }
  }, [restTimer])

  if (!restTimer) return null

  const remainingMs = Math.max(0, restTimer.endsAt - now)
  const remainingSec = Math.ceil(remainingMs / 1000)
  const totalMs = restTimer.totalSeconds * 1000
  const elapsedPct = totalMs > 0 ? Math.max(0, Math.min(1, (totalMs - remainingMs) / totalMs)) : 0
  const mm = Math.floor(remainingSec / 60)
  const ss = String(remainingSec % 60).padStart(2, '0')

  return (
    <div
      className="mx-[14px] mb-3 rounded-[18px] border border-paper-deep bg-app animate-rf-slide-up"
      style={{
        boxShadow: '0 -2px 0 rgba(0, 0, 0, 0.04), 0 16px 40px -10px rgba(0, 0, 0, 0.15)',
      }}
    >
      <div className="px-[18px] pt-3.5 pb-3.5">
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-brand">
              Repos{restTimer.label ? ` · ${restTimer.label}` : ''}
            </div>
            <div
              className="mt-0.5 font-serif italic font-extrabold leading-none tabular-nums text-fg"
              style={{ fontSize: 36, letterSpacing: '-1.5px' }}
            >
              {mm}:{ss}
            </div>
          </div>
          <button
            type="button"
            onClick={skipRestTimer}
            aria-label="Passer le repos"
            className="flex h-10 items-center gap-1.5 rounded-[10px] bg-transparent px-3.5 text-[12px] font-bold tracking-[0.04em] text-fg transition-colors hover:bg-paper-soft rf-focus-ring"
          >
            <Icon name="play" size={14} color="var(--color-text-primary)" strokeWidth={2} />
            Passer
          </button>
        </div>
        <div className="mt-2.5 h-1 overflow-hidden rounded-sm bg-paper-deep">
          <div
            className="h-full bg-brand transition-[width] duration-500 ease-linear"
            style={{ width: `${elapsedPct * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
