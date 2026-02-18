import { Link, useLocation } from 'react-router-dom'
import { Home, Calendar, History, User } from 'lucide-react'

const navItems = [
  { to: '/', icon: Home, label: 'Accueil', match: ['/'] },
  { to: '/week', icon: Calendar, label: 'Semaine', match: ['/week', '/program'] },
  { to: '/history', icon: History, label: 'Historique', match: ['/history'] },
  { to: '/profile', icon: User, label: 'Profil', match: ['/profile'] },
]

export function BottomNav() {
  const { pathname } = useLocation()
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-lg border-t border-gray-100 flex items-center justify-around px-4 z-50">
      {navItems.map(({ to, icon: Icon, label, match }) => {
        const active = match.includes(pathname)
        return (
          <Link key={to} to={to} className="flex flex-col items-center gap-1">
            <Icon className={`w-6 h-6 transition-colors ${active ? 'text-rose-600' : 'text-slate-300'}`} />
            <span className={`text-[10px] font-bold ${active ? 'text-rose-600' : 'text-slate-400'}`}>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
