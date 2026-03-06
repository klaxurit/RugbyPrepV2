import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { RugbyForgeLogo } from './RugbyForgeLogo'
import type { ReactNode } from 'react'

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
      {right && <div className="flex items-center gap-2 flex-shrink-0">{right}</div>}
    </header>
  )
}
