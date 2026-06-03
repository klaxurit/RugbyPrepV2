import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { useEntitlementsContext } from '../contexts/EntitlementsContext'
import { tr, type Lang } from '../i18n/appLabels'

type TierKind = 'pro' | 'free' | 'loading'

function resolveTierKind(loading: boolean, isPremium: boolean): TierKind {
  if (loading) return 'loading'
  return isPremium ? 'pro' : 'free'
}

/** Classes bordure avatar selon le tier (option C — anneau or / discret). */
function tierAvatarRingClass(loading: boolean, isPremium: boolean): string {
  const tier = resolveTierKind(loading, isPremium)
  if (tier === 'loading') return 'border-white/20 animate-pulse'
  if (tier === 'pro') {
    return 'border-pro ring-2 ring-pro/40 shadow-[0_0_10px_rgb(184_137_58/0.35)]'
  }
  return 'border-white/25'
}

/** Photo circulaire avec anneau tier (Pro = or, Free = discret). */
export function TierAvatarPhoto({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const { loading, isPremium } = useEntitlementsContext()
  const tier = resolveTierKind(loading, isPremium)

  return (
    <div
      data-testid="tier-avatar-photo"
      data-tier={tier}
      className={`relative h-full w-full overflow-hidden rounded-full border-2 bg-white/20 ${tierAvatarRingClass(loading, isPremium)} ${className}`.trim()}
    >
      {children}
    </div>
  )
}

/** Pastille PRO / FREE à côté de l'avatar (option A). */
export function TierBadge() {
  const { authState } = useAuth()
  const { profile } = useProfile()
  const { loading, isPremium } = useEntitlementsContext()

  const lang: Lang = (profile?.preferredLanguage as Lang | undefined) ?? 'fr'
  const isAuthenticated = authState.status === 'authenticated' && authState.user != null

  if (!isAuthenticated) return null

  const basePill =
    'inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider leading-none select-none'

  if (loading) {
    return (
      <span
        data-testid="tier-badge-loading"
        aria-hidden="true"
        className={`${basePill} h-[18px] w-10 animate-pulse bg-white/15`}
      />
    )
  }

  if (isPremium) {
    return (
      <span
        data-testid="tier-badge"
        data-tier="pro"
        aria-label={tr('account_tier_pro_aria', lang)}
        className={`${basePill} bg-pro text-shell shadow-sm ring-1 ring-pro-light/40`}
      >
        {tr('account_tier_pro_label', lang)}
      </span>
    )
  }

  return (
    <Link
      to="/profile#premium"
      data-testid="tier-badge"
      data-tier="free"
      aria-label={tr('account_tier_free_aria', lang)}
      className={`${basePill} bg-white/12 text-shell-text-muted ring-1 ring-white/20 transition-colors hover:bg-white/20 hover:text-shell-text focus:outline-none focus-visible:ring-2 focus-visible:ring-shell-text`}
    >
      {tr('account_tier_free_label', lang)}
    </Link>
  )
}

export const TIER_AVATAR_SIZE_CLASS =
  'relative h-14 w-14 shrink-0 overflow-visible'
