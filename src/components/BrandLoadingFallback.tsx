import { RugbyForgeLogo } from './RugbyForgeLogo'

interface BrandLoadingFallbackProps {
  /**
   * Variante shell authentifié : header + zone skeleton (anti-CLS).
   * Sans ce flag = cold start / auth plein viewport.
   */
  withBottomNav?: boolean
  /** Label a11y. */
  label?: string
}

/**
 * Fallback de chargement de route.
 *
 * - Cold start / auth : logo centré (LCP marque, pas de chrome).
 * - Shell authentifié (`withBottomNav`) : chrome stable (logo en haut +
 *   skeletons) pour éviter le saut logo-centré → page (CLS Play / CWV).
 */
export function BrandLoadingFallback({
  withBottomNav = false,
  label = 'Chargement',
}: BrandLoadingFallbackProps) {
  if (withBottomNav) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label={label}
        className="min-h-dvh bg-app pb-bottom-nav"
      >
        <div className="flex h-14 items-center justify-center border-b border-paper-deep/60 px-[22px]">
          <div className="motion-safe:animate-rf-pulse motion-safe:[animation-duration:2.4s]">
            <RugbyForgeLogo size="sm" />
          </div>
        </div>
        <div className="mx-auto max-w-md space-y-5 px-[22px] pt-6" aria-hidden>
          <div className="space-y-3 rounded-[20px] border-2 border-paper-deep bg-paper-soft px-[22px] py-5">
            <div className="h-3 w-24 animate-pulse rounded-xl bg-layer-5" />
            <div className="h-9 w-28 animate-pulse rounded-xl bg-layer-5" />
            <div className="h-2 w-full animate-pulse rounded-full bg-layer-5" />
            <div className="flex gap-2 pt-2">
              <div className="h-9 w-9 animate-pulse rounded-full bg-layer-5" />
              <div className="h-4 flex-1 animate-pulse rounded-xl bg-layer-5" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-32 animate-pulse rounded-xl bg-layer-5" />
            <div className="h-24 w-full animate-pulse rounded-[20px] bg-layer-5" />
            <div className="h-16 w-full animate-pulse rounded-[20px] bg-layer-5" />
          </div>
        </div>
        <span className="sr-only">{label}</span>
      </div>
    )
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-app"
    >
      <div className="motion-safe:animate-rf-pulse motion-safe:[animation-duration:2.4s]">
        <RugbyForgeLogo size="md" />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  )
}
