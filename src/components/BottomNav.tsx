import { Link, useLocation } from 'react-router-dom'
import { Home, Dumbbell, User } from 'lucide-react'

const navItems = [
  { to: '/home', icon: Home, label: 'Accueil', match: ['/home'] },
  { to: '/week', icon: Dumbbell, label: 'Programme', match: ['/week', '/calendar'] },
  { to: '/profile', icon: User, label: 'Profil', match: ['/profile', '/progress'] },
]

export function BottomNav() {
  const { pathname } = useLocation()
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-app/95 backdrop-blur-lg border-t border-brand-border flex items-center justify-around px-4 z-50">
      {navItems.map(({ to, icon: Icon, label, match }) => {
        const active = match.includes(pathname)
        return (
          <Link
            key={to}
            to={to}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-colors ${
              active ? 'bg-layer-10 text-brand-tint' : 'text-fg-muted'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-bold">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
