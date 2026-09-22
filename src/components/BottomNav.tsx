import { Link, useLocation } from 'react-router-dom'
import { Home, Dumbbell, Shield, User, Users } from 'lucide-react'
import { useProfile } from '../hooks/useProfile'
import { useStaffCoachAccess } from '../hooks/useStaffCoachAccess'
import { tr, type Lang, type AppLabelKey } from '../i18n/appLabels'

type NavItem = {
  to: string
  icon: typeof Home
  labelKey: AppLabelKey
  match: string[]
}

const baseNavItems: NavItem[] = [
  { to: '/home', icon: Home, labelKey: 'nav_home', match: ['/home'] },
  { to: '/week', icon: Dumbbell, labelKey: 'nav_program', match: ['/week'] },
  { to: '/squad', icon: Shield, labelKey: 'nav_squad', match: ['/squad'] },
  { to: '/profile', icon: User, labelKey: 'nav_profile', match: ['/profile', '/progress'] },
]

const coachNavItem: NavItem = {
  to: '/staff',
  icon: Users,
  labelKey: 'nav_coach',
  match: ['/staff'],
}

/**
 * Barre du bas — montée une seule fois via {@link AuthenticatedShell}.
 * Les icônes gardent leur nœud DOM d’une route à l’autre ; seul l’état
 * actif (couleur / fond) change.
 */
export function BottomNav() {
  const { pathname } = useLocation()
  const { profile } = useProfile()
  const { isStaffCoach, loading: staffLoading } = useStaffCoachAccess()
  const lang: Lang = ((profile?.preferredLanguage as Lang | undefined) ?? 'fr')

  const navItems = isStaffCoach && !staffLoading ? [...baseNavItems, coachNavItem] : baseNavItems

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-brand-border bg-app/95 pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] backdrop-blur-lg"
      aria-label={lang === 'fr' ? 'Navigation principale' : 'Main navigation'}
    >
      <div className="ios:h-16 flex h-20 items-center justify-around px-2">
        {navItems.map(({ to, icon: Icon, labelKey, match }) => {
          const active = match.includes(pathname)
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? 'page' : undefined}
              className={`flex min-w-0 flex-col items-center gap-1 rounded-2xl px-2 py-1.5 transition-colors ${
                active ? 'bg-layer-10 text-brand-tint' : 'text-fg-muted'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={2.2} aria-hidden />
              <span className="max-w-[4.5rem] truncate text-[10px] font-bold">
                {tr(labelKey, lang)}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
