import { Link } from 'react-router-dom'
import { ChevronLeft, User } from 'lucide-react'
import { RugbyForgeLogo } from './RugbyForgeLogo'
import type { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { getClubLogoUrl, getClubMonogram } from '../services/ui/clubLogos'
import { useScrollThemeColor } from '../hooks/useScrollThemeColor'

interface PageHeaderProps {
  /** Titre de la page affiché sous le logo */
  title: string
  /** Lien de retour (ex: "/" ou "/week"). Si absent, pas de bouton chevron. */
  backTo?: string
  /** Suffixe optionnel à côté du titre (ex: badge semaine) */
  titleSuffix?: ReactNode
  /** Contenu à droite du header (boutons, badges...) */
  right?: ReactNode
}

/**
 * Header de page harmonisé : [chevron] + RugbyForgeLogo (full) + titre en dessous.
 * Thème clair par défaut (crème + bordeaux). Suit les tokens sémantiques.
 */
export function PageHeader({ title, backTo, right }: PageHeaderProps) {
  useScrollThemeColor()
  const { authState } = useAuth()
  const { profile } = useProfile()
  const currentUser = authState.status === 'authenticated' ? authState.user : null
  const resolvedAvatarUrl = currentUser?.avatarUrl ?? profile.avatarUrl
  const clubLogoUrl = getClubLogoUrl(profile.clubCode)
  const clubMonogram = getClubMonogram(profile.clubName)
  const showProfileAvatar = currentUser != null
  return (
    <header
      className="px-6 py-4 backdrop-blur flex items-center justify-between sticky top-0 z-50 relative bg-shell shadow-[0_4px_16px_rgb(44_24_16/0.15)]"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
        {backTo && (
          <Link
            to={backTo}
            className="p-2 -ml-2 rounded-xl flex-shrink-0 transition-colors hover:bg-white/10 text-shell-text-muted hover:text-shell-text"
            aria-label="Retour"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <RugbyForgeLogo size="md" />
          <span className="sr-only">{title}</span>
        </div>
      </div>
      {(right || showProfileAvatar) && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {right}
              {showProfileAvatar ? (
          <Link
            to="/profile"
            aria-label="Voir mon profil"
            className="block rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-shell-text focus-visible:ring-offset-2 focus-visible:ring-offset-shell"
          >
            <div className="relative h-14 w-14">
              {/* Avatar 56px rond */}
              <div className="h-14 w-14 rounded-full overflow-hidden bg-white/15 border border-white/20">
                {resolvedAvatarUrl ? (
                  <img
                    src={resolvedAvatarUrl}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <User className="w-5 h-5 text-shell-text-muted" />
                  </div>
                )}
              </div>
              {/* Blason 28px — déborde en bas-droite */}
              <div className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full bg-white shadow-md flex items-center justify-center overflow-hidden ring-2 ring-shell">
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
          ) : null}
        </div>
      )}
    </header>
  )
}
