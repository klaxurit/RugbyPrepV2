import { Link } from 'react-router-dom'
import { ChevronRight, Crown } from 'lucide-react'
import type { AdminUserListItem } from '../../services/admin/adminApi'
import { formatSeasonModeLabel } from '../../config/adminUserDisplay'
import { StaffAthleteAvatar } from '../staffPlanning/StaffAthleteAvatar'
import { AdminClubBadge } from './AdminClubBadge'

function sessionActivityClass(done: number, planned: number | null): string {
  if (done <= 0) return 'bg-layer-10 text-fg-muted'
  if (planned != null && planned > 0 && done >= planned) return 'bg-emerald-500/15 text-emerald-800'
  return 'bg-brand/10 text-brand'
}

export function AdminUserCard({ user }: { user: AdminUserListItem }) {
  const name = user.displayName?.trim() || user.email?.split('@')[0] || 'Joueur'
  const planned = user.weeklySessions
  const done = user.sessionsThisWeek
  const detailHref = user.email
    ? `/admin?q=${encodeURIComponent(user.email)}`
    : `/admin?q=${encodeURIComponent(user.userId)}`

  return (
    <Link
      to={detailHref}
      className={`group block rounded-2xl border bg-layer-5 p-4 shadow-sm transition hover:bg-layer-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
        user.isPremium
          ? 'border-pro/50 hover:border-pro/70 ring-1 ring-pro/15'
          : 'border-brand-border hover:border-brand/40'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <StaffAthleteAvatar name={name} avatarUrl={user.avatarUrl} size="md" theme="app" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="m-0 truncate font-bold text-fg">{name}</p>
              {user.isPremium && (
                <span
                  className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-pro px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-shell ring-1 ring-pro-light/40"
                  title={user.isFounding ? 'Membre Founding' : 'Abonnement Pro'}
                >
                  <Crown className="h-2.5 w-2.5" aria-hidden />
                  {user.isFounding ? 'Founding' : 'Pro'}
                </span>
              )}
            </div>
            {user.email && (
              <p className="m-0 mt-0.5 truncate text-xs text-fg-muted">{user.email}</p>
            )}
          </div>
        </div>
        <AdminClubBadge clubCode={user.clubCode} clubName={user.clubName} size="sm" />
      </div>

      <div className="mt-3 space-y-2">
        <p className="m-0 truncate text-sm text-fg-muted">
          {user.clubName ?? user.clubCode ?? 'Sans club'}
        </p>

        <div
          className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${sessionActivityClass(done, planned)}`}
        >
          <span>
            {done} séance{done > 1 ? 's' : ''} cette semaine
          </span>
          {planned != null && planned > 0 && (
            <span className="opacity-70">/ {planned} prévues</span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 text-xs text-fg-muted">
          <span>{user.seasonMode ? formatSeasonModeLabel(user.seasonMode) : '—'}</span>
          {!user.hasProfile && <span className="text-slate-600">Compte sans profil</span>}
          {user.hasProfile && !user.onboardingComplete && (
            <span className="text-amber-700">Onboarding incomplet</span>
          )}
          <ChevronRight className="h-4 w-4 shrink-0 opacity-0 transition group-hover:opacity-100" />
        </div>
      </div>
    </Link>
  )
}
