import { Link } from 'react-router-dom'
import { ChevronLeft, User } from 'lucide-react'
import { RugbyForgeLogo } from './RugbyForgeLogo'
import { TierAvatarPhoto, TierBadge, TIER_AVATAR_SIZE_CLASS } from './TierBadge'
import type { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { getClubLogoUrl, getClubMonogram } from '../services/ui/clubLogos'
import { getPositionIllustration } from '../assets/positions'
import { useScrollThemeColor } from '../hooks/useScrollThemeColor'
import { tr, type Lang } from '../i18n/appLabels'

interface PageHeaderProps {
  /** Titre de la page affiché sous le logo */
  title: string
  /** Lien de retour (ex: "/" ou "/week"). Si absent, pas de bouton chevron. */
  backTo?: string
  /** Suffixe optionnel à côté du titre (ex: badge semaine) */
  titleSuffix?: ReactNode
  /** Contenu à droite du header (boutons, badges...) */
  right?: ReactNode
  /** Séance / plein écran : masquer le lien profil pour prioriser une action à droite (ex. fermer la séance). */
  suppressProfileLink?: boolean
}

/**
 * Header de page harmonisé : [chevron] + RugbyForgeLogo (full) + titre en dessous.
 * Thème clair par défaut (crème + bordeaux). Suit les tokens sémantiques.
 */
export function PageHeader({ title, backTo, titleSuffix, right, suppressProfileLink }: PageHeaderProps) {
  useScrollThemeColor()
  const { authState } = useAuth()
  const { profile } = useProfile()
  const lang: Lang = ((profile?.preferredLanguage as Lang | undefined) ?? 'fr')
  const currentUser = authState.status === 'authenticated' ? authState.user : null
  const resolvedAvatarUrl = currentUser?.avatarUrl ?? profile.avatarUrl
  const positionIllustration = getPositionIllustration(profile.rugbyPosition ?? profile.position)
  const clubLogoUrl = getClubLogoUrl(profile.clubCode)
  const clubMonogram = getClubMonogram(profile.clubName)
  const showProfileAvatar = currentUser != null
  return (
    <header className="sticky top-0 z-50 overflow-visible bg-shell shadow-[0_4px_16px_rgb(44_24_16/0.15)]">
      <div className="relative flex items-center justify-between overflow-visible px-6 py-4 ios:py-3 pt-[max(1rem,env(safe-area-inset-top))] ios:pt-[env(safe-area-inset-top)] pl-[max(1.5rem,env(safe-area-inset-left))] pr-[max(1.5rem,env(safe-area-inset-right))]">
        <div className="flex items-center gap-3 min-w-0 flex-1">
        {backTo && (
          <Link
            to={backTo}
            className="p-2 -ml-2 rounded-xl flex-shrink-0 transition-colors hover:bg-white/20 text-shell-text-muted hover:text-shell-text"
            aria-label={tr('page_header_back', lang)}
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <RugbyForgeLogo size="md" />
          {titleSuffix ? (
            <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-shell-text-muted text-center sm:text-left">
              {titleSuffix}
            </p>
          ) : null}
          <span className="sr-only">{title}</span>
        </div>
      </div>
      {(right || (showProfileAvatar && !suppressProfileLink)) && (
        <div className="relative flex shrink-0 items-center gap-1.5 overflow-visible">
          {right}
              {showProfileAvatar && !suppressProfileLink ? (
          <>
            <TierBadge />
            <Link
              to="/profile"
              aria-label={tr('page_header_profile', lang)}
              className="relative block overflow-visible rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-shell-text focus-visible:ring-offset-2 focus-visible:ring-offset-shell"
            >
              <div className={TIER_AVATAR_SIZE_CLASS}>
                <TierAvatarPhoto>
                  {resolvedAvatarUrl ? (
                    <img
                      src={resolvedAvatarUrl}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : positionIllustration ? (
                    <img
                      src={positionIllustration}
                      alt="Avatar poste"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <User className="w-5 h-5 text-shell-text-muted" />
                    </div>
                  )}
                </TierAvatarPhoto>
                {/* Blason 28px — déborde en bas-droite */}
                <div className="absolute -bottom-2 -right-2 z-40 h-7 w-7 rounded-full bg-white shadow-md flex items-center justify-center overflow-hidden ring-2 ring-shell">
                  {clubLogoUrl ? (
                    <img
                      src={clubLogoUrl}
                      alt={profile.clubName ?? 'Club'}
                      className="h-5 w-5 object-contain"
                    />
                  ) : (
                    <span className="text-[8px] font-black text-fg-muted">{clubMonogram}</span>
                  )}
                </div>
              </div>
            </Link>
          </>
          ) : null}
        </div>
      )}
      </div>
    </header>
  )
}
