import type { ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { usePremiumCheckout } from '../hooks/usePremiumCheckout'

interface PremiumBlurredPreviewProps {
  /** The actual premium content to render (blurred for free users) */
  children: ReactNode
  /** Short label shown on the unlock overlay */
  label?: string
  /** If true, the content is a placeholder/fake — don't blur, just overlay */
  placeholder?: boolean
}

export function PremiumBlurredPreview({
  children,
  label = 'Premium',
  placeholder,
}: PremiumBlurredPreviewProps) {
  const { startCheckout, loading } = usePremiumCheckout()

  return (
    <div className="relative">
      {/* Blurred content with soft fade on all edges */}
      <div
        className={placeholder ? 'opacity-40' : 'blur-[6px] opacity-50'}
        aria-hidden
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
          maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent), linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent), linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
          maskComposite: 'intersect',
          WebkitMaskComposite: 'source-in',
        }}
      >
        {children}
      </div>

      {/* Overlay — transparent, just the badge */}
      <button
        type="button"
        onClick={() => startCheckout('premium_monthly')}
        disabled={loading}
        className="absolute inset-0 flex items-center justify-center cursor-pointer"
      >
        <div className="flex items-center gap-2 bg-[#1a100c]/80 border border-[#ff6b35]/30 px-4 py-2.5 rounded-full shadow-lg">
          <Lock className="w-3.5 h-3.5 text-[#ff6b35]" />
          <span className="text-xs font-black text-[#ff6b35]">{label}</span>
        </div>
      </button>
    </div>
  )
}
