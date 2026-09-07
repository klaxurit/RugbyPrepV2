import type { AdminUserMatch } from '../../services/admin/adminApi'

function MatchRow({
  match,
  todayIso,
  firstMatchDate,
  leftover,
  disabled,
  onToggleHidden,
}: {
  match: AdminUserMatch
  todayIso: string
  firstMatchDate: string | null
  leftover: boolean
  disabled?: boolean
  onToggleHidden: (matchId: string, hidden: boolean) => void
}) {
  const isJ1 = firstMatchDate != null && match.date === firstMatchDate && !match.user_hidden
  const isNext = !match.user_hidden && match.date >= todayIso && match.date === firstMatchDate
  return (
    <li className="flex items-start justify-between gap-2 text-xs py-0.5">
      <div className="min-w-0">
        <span className="font-mono">{match.date}</span>
        {match.opponent ? ` · ${match.opponent}` : ''}
        {match.source ? ` · ${match.source}` : ''}
        {isJ1 && <span className="ml-1 font-semibold text-brand-tint">J1 moteur</span>}
        {leftover && !match.user_hidden && (
          <span className="ml-1 font-semibold text-amber-800">avant inter-saison</span>
        )}
        {match.user_hidden && <span className="ml-1 text-fg-muted">masqué</span>}
        {isNext && !isJ1 ? <span className="ml-1 text-fg-muted">prochain</span> : null}
      </div>
      {match.id && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onToggleHidden(match.id!, !match.user_hidden)}
          className="shrink-0 text-[11px] font-semibold text-brand-tint disabled:opacity-50"
        >
          {match.user_hidden ? 'Réafficher' : 'Ne plus compter'}
        </button>
      )}
    </li>
  )
}

export function AdminMatchCalendarList({
  matches,
  todayIso,
  firstMatchDate,
  offSeasonStartAt,
  disabled,
  onToggleHidden,
}: {
  matches: AdminUserMatch[]
  todayIso: string
  firstMatchDate: string | null
  offSeasonStartAt: string | null
  disabled?: boolean
  onToggleHidden: (matchId: string, hidden: boolean) => void
}) {
  const offStart = offSeasonStartAt?.slice(0, 10) ?? null
  const sorted = [...matches].sort((a, b) => a.date.localeCompare(b.date))
  const leftover = sorted.filter((m) => !m.user_hidden && offStart != null && m.date < offStart)
  const hidden = sorted.filter((m) => m.user_hidden)
  const upcoming = sorted.filter((m) => !m.user_hidden && m.date >= todayIso)
  const pastOther = sorted.filter(
    (m) => !m.user_hidden && m.date < todayIso && !(offStart != null && m.date < offStart),
  )

  if (sorted.length === 0) {
    return (
      <section className="rounded-2xl border border-brand-border bg-layer-5 p-4">
        <p className="text-xs font-semibold uppercase text-fg-muted">Matchs</p>
        <p className="text-sm text-fg-muted mt-1">Aucun match au calendrier.</p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-brand-border bg-layer-5 p-4 space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase text-fg-muted">Matchs</p>
        <p className="text-xs text-fg-muted mt-1">
          Le J1 moteur = 1er match visible à partir de offSeasonStartAt. Un match plus tôt recale toute
          l’année (ex. En saison S17).
        </p>
      </div>

      {leftover.length > 0 && (
        <div className="rounded-xl border border-amber-600/30 bg-amber-50 px-3 py-2 space-y-1">
          <p className="text-xs font-semibold text-amber-950">Avant inter-saison ({leftover.length})</p>
          <ul>
            {leftover.map((m) => (
              <MatchRow
                key={m.id ?? `${m.date}-${m.opponent ?? ''}`}
                match={m}
                todayIso={todayIso}
                firstMatchDate={firstMatchDate}
                leftover
                disabled={disabled}
                onToggleHidden={onToggleHidden}
              />
            ))}
          </ul>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-fg-muted">À venir ({upcoming.length})</p>
          <ul>
            {upcoming.slice(0, 8).map((m) => (
              <MatchRow
                key={m.id ?? `${m.date}-${m.opponent ?? ''}`}
                match={m}
                todayIso={todayIso}
                firstMatchDate={firstMatchDate}
                leftover={false}
                disabled={disabled}
                onToggleHidden={onToggleHidden}
              />
            ))}
          </ul>
          {upcoming.length > 8 && (
            <p className="text-xs text-fg-muted">+ {upcoming.length - 8} autres</p>
          )}
        </div>
      )}

      {pastOther.length > 0 && (
        <details className="text-xs text-fg-muted">
          <summary className="cursor-pointer font-semibold">
            Passés cette saison ({pastOther.length})
          </summary>
          <ul className="mt-1">
            {pastOther.map((m) => (
              <MatchRow
                key={m.id ?? `${m.date}-${m.opponent ?? ''}`}
                match={m}
                todayIso={todayIso}
                firstMatchDate={firstMatchDate}
                leftover={false}
                disabled={disabled}
                onToggleHidden={onToggleHidden}
              />
            ))}
          </ul>
        </details>
      )}

      {hidden.length > 0 && (
        <details className="text-xs text-fg-muted">
          <summary className="cursor-pointer font-semibold">Masqués ({hidden.length})</summary>
          <ul className="mt-1">
            {hidden.map((m) => (
              <MatchRow
                key={m.id ?? `${m.date}-${m.opponent ?? ''}`}
                match={m}
                todayIso={todayIso}
                firstMatchDate={firstMatchDate}
                leftover={false}
                disabled={disabled}
                onToggleHidden={onToggleHidden}
              />
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}
