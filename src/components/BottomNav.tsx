import { Link, useLocation } from 'react-router-dom'
import { Home, Dumbbell, User, Users } from 'lucide-react'
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
  { to: '/profile', icon: User, labelKey: 'nav_profile', match: ['/profile', '/progress'] },
]

const coachNavItem: NavItem = {
  to: '/staff',
  icon: Users,
  labelKey: 'nav_coach',
  match: ['/staff'],
}

export function BottomNav() {
  const { pathname } = useLocation()
  const { profile } = useProfile()
  const { isStaffCoach, loading: staffLoading } = useStaffCoachAccess()
  const lang: Lang = ((profile?.preferredLanguage as Lang | undefined) ?? 'fr')

  const navItems = isStaffCoach && !staffLoading ? [...baseNavItems, coachNavItem] : baseNavItems

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-app/95 backdrop-blur-lg border-t border-brand-border z-50 pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      <div className="h-20 ios:h-16 flex items-center justify-around px-2">
        {navItems.map(({ to, icon: Icon, labelKey, match }) => {
          const active = match.includes(pathname)
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-2xl transition-colors min-w-0 ${
                active ? 'bg-layer-10 text-brand-tint' : 'text-fg-muted'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="text-[10px] font-bold truncate max-w-[4.5rem]">{tr(labelKey, lang)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
