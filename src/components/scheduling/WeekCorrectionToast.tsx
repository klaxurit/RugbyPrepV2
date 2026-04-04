import { useEffect } from 'react'
import { CheckCircle2 } from 'lucide-react'

interface WeekCorrectionToastProps {
  message: string | null
  onDismiss: () => void
  duration?: number
}

export function WeekCorrectionToast({
  message,
  onDismiss,
  duration = 2500,
}: WeekCorrectionToastProps) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [message, onDismiss, duration])

  if (!message) return null

  return (
    <div
      data-testid="week-correction-toast"
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-app/95 border border-border-dashed-app shadow-elevated backdrop-blur-sm animate-fade-in"
    >
      <CheckCircle2 className="w-4 h-4 text-ok-strong flex-shrink-0" />
      <span className="text-xs font-bold text-fg-secondary">{message}</span>
    </div>
  )
}
