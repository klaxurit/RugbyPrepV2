import type { ReactNode } from 'react'
import { Heart, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { Icon, SectionLabel } from '../ui'
import { ClubAvatar } from '../match/ClubAvatar'
import { LeagueCrest } from './LeagueCrest'
import {
  leagueTierDivisionLabel,
  leagueTierLabel,
  levelLabel,
} from '../../services/gamification/labels'
import {
  formCueAriaLabel,
  formCueIconName,
} from '../../services/gamification/badgeIcon'
import { formCueForEntry } from '../../services/gamification/rankLeaderboard'
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
  /** Illustration optionnelle au-dessus / à la place du texte vide. */
  emptyArt?: ReactNode
  testId?: string
}

/**
 * Tableau de classement — cohorte de ligue ou club.
 *
 *  1. Totaux seulement, jamais d'écarts (« −40 pts »).
 *  2. Logo club + indice de forme SVG (enchaîne / en pause) à côté du pseudo.
 *  3. Kudos sur chaque ligne (sauf soi).
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
  emptyArt,
  testId,
}: LeagueBoardProps) {
  return (
    <section data-testid={testId}>
      <SectionLabel
        label={title}
        trailing={
          tier ? (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-brand">
              <LeagueCrest tier={tier} size={18} />
              <span>
                {leagueTierLabel(tier, lang)}
                <span className="ml-1 font-bold normal-case tracking-normal text-fg/45">
                  {leagueTierDivisionLabel(tier, lang)}
                </span>
              </span>
            </span>
          ) : undefined
        }
      />

      {entries.length === 0 ? (
        emptyArt ? (
          <div className="mt-3 rounded-2xl border border-dashed border-fg/25 px-4 py-4">
            {emptyArt}
          </div>
        ) : (
          <p className="mt-3 rounded-2xl border border-dashed border-fg/25 px-4 py-4 text-[12px] leading-relaxed text-fg/60">
            {emptyLabel}
          </p>
        )
      ) : (
        <ul className="mt-3 space-y-1.5">
          {entries.map((entry) => {
            const promoted = promotionCutoff > 0 && entry.rank <= promotionCutoff
            const relegated = relegationCutoff > 0 && entry.rank >= relegationCutoff
            const kudosSent = kudosGiven.has(entry.userId)
            const formCue = formCueForEntry(entry)

            return (
              <li
                key={entry.userId}
                data-testid={entry.isSelf ? 'league-row-self' : 'league-row'}
                className={`flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 ${
                  entry.isSelf
                    ? 'border-brand bg-brand-soft'
                    : 'border-paper-deep bg-paper-soft'
                }`}
              >
                <span className="w-5 shrink-0 text-center text-[13px] font-black tabular-nums text-fg/70">
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

                <ClubAvatar
                  code={entry.clubCode ?? undefined}
                  name={entry.clubName ?? entry.displayName}
                  size="sm"
                />

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 truncate text-[13px] font-bold text-fg">
                    <span className="truncate">{entry.displayName}</span>
                    {formCue && (
                      <span
                        className={`inline-flex shrink-0 ${
                          formCue === 'hot' ? 'text-pro' : 'text-fg/45'
                        }`}
                        aria-label={formCueAriaLabel(formCue, lang)}
                        data-testid="league-form-cue"
                        data-form-cue={formCue}
                      >
                        <Icon name={formCueIconName(formCue)} size={12} strokeWidth={2.2} />
                      </span>
                    )}
                    {entry.isSelf && (
                      <span className="ml-0.5 shrink-0 text-[10px] font-extrabold uppercase tracking-[0.1em] text-brand">
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
