import { Heart, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { SectionLabel } from '../ui'
import { leagueTierLabel, levelLabel } from '../../services/gamification/labels'
import type { Lang } from '../../i18n/appLabels'
import type { LeaderboardEntry, LeagueTier } from '../../types/gamification'

export interface LeagueBoardProps {
  title: string
  entries: readonly LeaderboardEntry[]
  /** Palier de la cohorte, affiché en sous-titre. Absent pour le classement club. */
  tier?: LeagueTier
  /** Dernier rang promu. 0 = pas de mouvement sur cette cohorte. */
  promotionCutoff?: number
  /** Premier rang relégué. 0 = pas de mouvement. */
  relegationCutoff?: number
  kudosGiven: ReadonlySet<string>
  onGiveKudos?: (userId: string) => void
  lang: Lang
  emptyLabel: string
  testId?: string
}

/**
 * Tableau de classement — cohorte de ligue ou club.
 *
 * Deux partis pris d'interface :
 *
 *  1. La ligne de l'athlète est mise en valeur mais **jamais** son écart aux
 *     autres : on affiche des totaux, pas des « −40 pts sur le premier ».
 *  2. Le bouton kudos est présent sur chaque ligne. Pouvoir saluer un
 *     coéquipier au lieu de seulement se comparer à lui est ce qui rend un
 *     classement tenable dans une équipe qui se croise à l'entraînement.
 */
export function LeagueBoard({
  title,
  entries,
  tier,
  promotionCutoff = 0,
  relegationCutoff = 0,
  kudosGiven,
  onGiveKudos,
  lang,
  emptyLabel,
  testId,
}: LeagueBoardProps) {
  return (
    <section data-testid={testId}>
      <SectionLabel
        label={title}
        trailing={
          tier ? (
            <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-brand">
              {leagueTierLabel(tier, lang)}
            </span>
          ) : undefined
        }
      />

      {entries.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-fg/25 px-4 py-4 text-[12px] leading-relaxed text-fg/60">
          {emptyLabel}
        </p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {entries.map((entry) => {
            const promoted = promotionCutoff > 0 && entry.rank <= promotionCutoff
            const relegated = relegationCutoff > 0 && entry.rank >= relegationCutoff
            const kudosSent = kudosGiven.has(entry.userId)

            return (
              <li
                key={entry.userId}
                data-testid={entry.isSelf ? 'league-row-self' : 'league-row'}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 ${
                  entry.isSelf
                    ? 'border-brand bg-brand-soft'
                    : 'border-paper-deep bg-paper-soft'
                }`}
              >
                <span className="w-6 shrink-0 text-center text-[13px] font-black tabular-nums text-fg/70">
                  {entry.rank}
                </span>

                <span className="shrink-0" aria-hidden>
                  {promoted ? (
                    <TrendingUp className="h-3.5 w-3.5 text-ok" />
                  ) : relegated ? (
                    <TrendingDown className="h-3.5 w-3.5 text-warn" />
                  ) : (
                    <Minus className="h-3.5 w-3.5 text-fg/25" />
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold text-fg">
                    {entry.displayName}
                    {entry.isSelf && (
                      <span className="ml-1.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-brand">
                        {lang === 'fr' ? 'toi' : 'you'}
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-[10px] font-semibold text-fg/50">
                    {levelLabel(entry.level, lang)}
                    {' · '}
                    {entry.sessionsCompleted}
                    {lang === 'fr' ? ' séances' : ' sessions'}
                  </span>
                </span>

                <span className="shrink-0 text-[13px] font-black tabular-nums text-fg">
                  {entry.points}
                </span>

                {onGiveKudos && !entry.isSelf && (
                  <button
                    type="button"
                    data-testid="kudos-button"
                    disabled={kudosSent}
                    onClick={() => onGiveKudos(entry.userId)}
                    aria-label={
                      kudosSent
                        ? lang === 'fr'
                          ? `Déjà salué : ${entry.displayName}`
                          : `Already gave kudos to ${entry.displayName}`
                        : lang === 'fr'
                          ? `Saluer la séance de ${entry.displayName}`
                          : `Give kudos to ${entry.displayName}`
                    }
                    className={`shrink-0 rounded-xl border p-1.5 transition-colors rf-focus-ring ${
                      kudosSent
                        ? 'border-brand bg-brand text-on-brand'
                        : 'border-paper-deep text-fg/45 hover:border-brand hover:text-brand'
                    }`}
                  >
                    <Heart
                      className="h-3.5 w-3.5"
                      strokeWidth={2.2}
                      fill={kudosSent ? 'currentColor' : 'none'}
                    />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {entries.length > 0 && promotionCutoff > 0 && (
        <p className="mt-2 text-[10px] font-semibold leading-relaxed text-fg/50">
          {lang === 'fr'
            ? `Top ${promotionCutoff} promus lundi, derniers relégués. Le classement repart de zéro chaque semaine.`
            : `Top ${promotionCutoff} move up on Monday, the bottom moves down. The board resets every week.`}
        </p>
      )}
    </section>
  )
}
