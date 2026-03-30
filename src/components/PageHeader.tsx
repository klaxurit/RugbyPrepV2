import { Link } from 'react-router-dom'
import { ChevronLeft, User } from 'lucide-react'
import { RugbyForgeLogo } from './RugbyForgeLogo'
import type { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { getClubLogoUrl, getClubMonogram } from '../services/ui/clubLogos'

interface PageHeaderProps {
  /** Titre de la page affiché sous le logo */
  title: string
  /** Lien de retour (ex: "/" ou "/week"). Si absent, pas de bouton chevron. */
  backTo?: string
  /** Suffixe optionnel à côté du titre (ex: badge semaine) */
  titleSuffix?: ReactNode
  /** Contenu à droite du header (boutons, badges...) */
  right?: ReactNode
  /** Thème : dark (défaut) ou light pour pages claires */
  variant?: 'dark' | 'light'
}

/**
 * Header de page harmonisé : [chevron] + RugbyForgeLogo + titre en dessous.
 * Utiliser sur toutes les pages pour cohérence visuelle.
 */
export function PageHeader({ title, backTo, titleSuffix, right, variant = 'dark' }: PageHeaderProps) {
  const isDark = variant === 'dark'
  const { authState } = useAuth()
  const { profile } = useProfile()
  const currentUser = authState.status === 'authenticated' ? authState.user : null
  const resolvedAvatarUrl = currentUser?.avatarUrl ?? profile.avatarUrl
  const clubLogoUrl = getClubLogoUrl(profile.clubCode)
  const clubMonogram = getClubMonogram(profile.clubName)
  const showProfileAvatar = currentUser != null
  const rightOffsetRing = isDark ? 'focus-visible:ring-offset-[#1a100c]' : 'focus-visible:ring-offset-white'
  return (
    <header
      className={`px-6 py-4 backdrop-blur flex items-center justify-between sticky top-0 z-50 relative ${
        isDark ? 'bg-[#1a100c]/95 border-b border-white/10' : 'bg-white/95 border-b border-gray-100'
      }`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
        {backTo && (
          <Link
            to={backTo}
            className={`p-2 -ml-2 rounded-xl flex-shrink-0 transition-colors ${
              isDark
                ? 'hover:bg-white/10 text-white/50 hover:text-white'
                : 'hover:bg-gray-100 text-slate-400 hover:text-slate-600'
            }`}
            aria-label="Retour"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <RugbyForgeLogo size="sm" />
          <h1
            className={`text-xl font-extrabold tracking-tight mt-0.5 truncate ${
              isDark ? 'text-white' : 'text-[#1f2937]'
            }`}
          >
            {title}
            {titleSuffix && (
              <span className={`ml-2 text-sm font-bold ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                {titleSuffix}
              </span>
            )}
          </h1>
        </div>
      </div>
      {(right || showProfileAvatar) && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {right}
              {showProfileAvatar ? (
          <Link
            to="/profile"
            aria-label="Voir mon profil"
            className={`block rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35] focus-visible:ring-offset-2 ${rightOffsetRing}`}
          >
            <div className="relative h-11 w-11">
              <div className="h-11 w-11 rounded-full bg-white/10 border border-white/10 overflow-hidden flex items-center justify-center">
                {resolvedAvatarUrl ? (
                  <img
                    src={resolvedAvatarUrl}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-white/30" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-[#1a100c] border border-white/10 flex items-center justify-center overflow-hidden">
                {clubLogoUrl ? (
                  <img
                    src={clubLogoUrl}
                    alt={profile.clubName ?? 'Club'}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-[8px] font-black text-white/50">{clubMonogram}</span>
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
