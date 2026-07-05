import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Trophy, TrendingUp } from 'lucide-react'
import type { LivePRToastData } from '../../services/pr/formatLivePRToast'

interface SessionPRToastProps {
  data: LivePRToastData | null
  onDismiss: () => void
  duration?: number
  stackAboveRest?: boolean
}

export function SessionPRToast({
  data,
  onDismiss,
  duration = 3600,
  stackAboveRest = false,
}: SessionPRToastProps) {
  useEffect(() => {
    if (!data) return
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [data, onDismiss, duration])

  if (!data) return null

  const bottomClass = stackAboveRest ? 'bottom-[15.5rem]' : 'bottom-32'
  const isPersonal = data.kind === 'personal'

  return createPortal(
    <div
      role="status"
      data-testid="session-pr-toast"
      className={`fixed left-1/2 z-[100] w-[min(92vw,22rem)] -translate-x-1/2 animate-fade-in ${bottomClass}`}
    >
      <div
        className={`overflow-hidden rounded-2xl border shadow-[0_20px_50px_-12px_rgba(0,0,0,0.4)] ${
          isPersonal
            ? 'border-brand/35 bg-gradient-to-br from-app via-app to-brand/[0.08]'
            : 'border-paper-deep bg-app'
        }`}
      >
        <div className="flex items-start gap-3 px-4 py-3.5">
          <span
            className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
              isPersonal ? 'bg-brand text-on-brand' : 'bg-layer-20 text-brand'
            }`}
          >
            <Trophy className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-brand">
              {data.title}
            </p>
            <p className="mt-0.5 truncate text-[14px] font-bold leading-tight text-fg">
              {data.exerciseName}
            </p>
            <p className="mt-1 text-[13px] font-semibold tabular-nums text-fg/80">
              {data.setLabel}
            </p>
          </div>
          {data.delta && (
            <span className="inline-flex flex-shrink-0 items-center gap-0.5 rounded-full bg-win/15 px-2 py-1 text-[11px] font-extrabold tabular-nums text-win">
              <TrendingUp className="h-3 w-3" strokeWidth={2.5} />
              {data.delta}
            </span>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
