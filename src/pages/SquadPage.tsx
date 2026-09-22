import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import {
  ClubChallengeCard,
  DuelsSection,
  EmptyArtInvite,
  EmptyArtPendingMonday,
  EmptyArtPrivateLock,
  LeagueBoard,
  LeagueCrest,
  RigorBadgesStrip,
  SocialVisibilityPicker,
} from '../components/gamification'
import { LeagueBoardSkeleton } from '../components/SkeletonCard'
import { Icon, Pill } from '../components/ui'
import { useGamification } from '../hooks/useGamification'
import { useProfile } from '../hooks/useProfile'
import { useSquad } from '../hooks/useSquad'
import {
  leagueTierDivisionLabel,
  leagueTierLabel,
  levelLabel,
} from '../services/gamification/labels'
import { leagueCountdownLabel } from '../services/gamification/leagueTierCopy'
import { daysUntilNextWeekStart } from '../services/gamification/weekStart'
import { getToday } from '../services/ui/debugDateOverride'
import type { Lang } from '../i18n/appLabels'

/**
 * Page « Groupe » — la surface sociale de la gamification.
 *
 * Structure voulue : la ligue hebdomadaire d'abord (l'arène gagnable, qui se
 * réinitialise et entretient donc la récurrence), le défi collectif ensuite
 * (contrepoids coopératif au classement), les duels enfin (confrontation
 * directe, volontaire).
 *
 * Tant que l'athlète est `private`, la page n'affiche aucun classement : elle
 * explique ce que l'opt-in expose et ce qu'il n'expose jamais. Le consentement
 * précède la donnée, pas l'inverse.
 */
export function SquadPage() {
  const { profile, updateProfile } = useProfile()
  const lang: Lang = ((profile?.preferredLanguage as Lang | undefined) ?? 'fr')
  const today = useMemo(() => getToday(), [])

  const { profile: gamification, currentWeek, levelProgress, badges } = useGamification(today)
  const {
    clubLeaderboard,
    cohort,
    challenge,
    duels,
    duelCandidates,
    kudosGiven,
    loading,
    challengeAthlete,
    respondToDuel,
    giveKudos,
  } = useSquad(today)

  const visibility = profile.socialVisibility ?? 'private'
  const isPrivate = visibility === 'private'

  return (
    <div className="min-h-screen bg-app font-sans text-fg pb-bottom-nav">
      <PageHeader title={lang === 'fr' ? 'Groupe' : 'Squad'} />

      <main className="max-w-md mx-auto px-[22px] pt-5 pb-8 space-y-6">
        {/* ─── Bandeau d'identité : niveau, palier, points de la semaine ─── */}
        <section
          data-testid="squad-identity"
          className="rounded-[20px] border border-paper-deep bg-paper-soft px-[18px] py-4"
        >
          <div className="flex items-center gap-3.5">
            {gamification && (
              <LeagueCrest tier={gamification.leagueTier} size={56} />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-fg/45">
                    {lang === 'fr' ? 'Ton palier' : 'Your level'}
                  </p>
                  <p className="mt-0.5 text-[18px] font-black leading-tight text-fg">
                    {levelLabel(levelProgress.level, lang)}
                  </p>
                </div>
                {gamification && (
                  <Pill tone="wine" size="sm">
                    {leagueTierLabel(gamification.leagueTier, lang)}
                    <span className="ml-1 opacity-70">
                      {leagueTierDivisionLabel(gamification.leagueTier, lang)}
                    </span>
                  </Pill>
                )}
              </div>
              <p className="mt-1.5 text-[11px] font-bold tabular-nums text-fg/60">
                {currentWeek?.points ?? 0}
                {lang === 'fr' ? ' pts cette semaine' : ' pts this week'}
              </p>
              {gamification && gamification.currentWeekStreak > 0 && (
                <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-bold text-pro">
                  <Icon name="flame" size={12} strokeWidth={2.4} />
                  {lang === 'fr'
                    ? `${gamification.currentWeekStreak} semaines de suite`
                    : `${gamification.currentWeekStreak} weeks in a row`}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Progression personnelle : indépendante de l'opt-in social, puisque
            rien ici n'est visible par un coéquipier. */}
        <RigorBadgesStrip badges={badges} lang={lang} />

        {isPrivate ? (
          <section data-testid="squad-optin" className="space-y-3">
            <div className="rounded-2xl border border-paper-deep bg-paper-soft px-4 py-5 text-center">
              <EmptyArtPrivateLock size={96} />
              <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-fg/45">
                {lang === 'fr' ? 'Classement sous clé' : 'Board under lock'}
              </p>
            </div>
            <div>
              <h2 className="text-sm font-black text-fg">
                {lang === 'fr' ? 'Rejoindre le classement' : 'Join the board'}
              </h2>
              <p className="mt-1 text-[12px] leading-relaxed text-fg-muted">
                {lang === 'fr'
                  ? 'Les classements se jouent sur la conformité à ton plan, pas sur le volume : tenir une semaine de décharge rapporte autant qu’une semaine de charge. Tu choisis ce que tes coéquipiers voient.'
                  : 'Boards are played on how well you stick to your plan, not on volume: a respected deload week pays as much as a loading week. You choose what teammates see.'}
              </p>
            </div>
            <SocialVisibilityPicker
              value={visibility}
              onChange={(next) => updateProfile({ socialVisibility: next })}
              displayName={profile.displayName ?? null}
              lang={lang}
            />
          </section>
        ) : (
          <>
            {loading ? (
              <LeagueBoardSkeleton rows={5} />
            ) : (
              <>
                {cohort && (
                  <LeagueBoard
                    testId="squad-league"
                    title={lang === 'fr' ? 'Ligue de la semaine' : 'This week’s league'}
                    entries={cohort.entries}
                    tier={cohort.tier}
                    promotionCutoff={cohort.promotionCutoff}
                    relegationCutoff={cohort.relegationCutoff}
                    kudosGiven={kudosGiven}
                    onGiveKudos={giveKudos}
                    lang={lang}
                    emptyLabel=""
                    todayISO={today}
                  />
                )}

                {/* Pas encore de cohorte : les cohortes sont formées le lundi par le
                    cron. On l'explique au lieu d'afficher un tableau vide. */}
                {!cohort && visibility === 'cohort' && (
                  <div
                    data-testid="squad-league-pending"
                    className="rounded-2xl border border-dashed border-fg/25 px-4 py-5 text-center"
                  >
                    <EmptyArtPendingMonday size={96} />
                    <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-fg/45">
                      {lang === 'fr' ? 'Classement en préparation' : 'Board cooking'}
                    </p>
                    <p className="mt-2 text-[12px] leading-relaxed text-fg/60">
                      {lang === 'fr'
                        ? 'Ta ligue est constituée lundi matin. D’ici là, tes points de la semaine comptent déjà.'
                        : 'Your league is formed on Monday morning. Until then, your weekly points already count.'}
                    </p>
                    <p
                      data-testid="league-countdown"
                      className="mt-2 text-[11px] font-bold tabular-nums text-fg/55"
                    >
                      {leagueCountdownLabel(daysUntilNextWeekStart(today), lang)}
                    </p>
                  </div>
                )}

                {visibility === 'club' && (
                  <p
                    data-testid="squad-league-locked"
                    className="rounded-2xl border border-dashed border-fg/25 px-4 py-4 text-[12px] leading-relaxed text-fg/60"
                  >
                    {lang === 'fr'
                      ? 'Les ligues hebdomadaires demandent la visibilité « Club + ligue hebdo ».'
                      : 'Weekly leagues require the “Club + weekly league” visibility.'}
                    <Link
                      to="/profile#social"
                      className="ml-1 font-bold text-brand underline underline-offset-2"
                    >
                      {lang === 'fr' ? 'Modifier' : 'Change'}
                    </Link>
                  </p>
                )}

                {challenge && <ClubChallengeCard challenge={challenge} lang={lang} />}

                <LeagueBoard
                  testId="squad-club"
                  title={lang === 'fr' ? 'Classement du club' : 'Club board'}
                  entries={clubLeaderboard}
                  kudosGiven={kudosGiven}
                  onGiveKudos={giveKudos}
                  lang={lang}
                  emptyLabel=""
                  emptyArt={
                    <div className="px-2 py-3 text-center">
                      <EmptyArtInvite size={96} />
                      <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-fg/45">
                        {lang === 'fr' ? 'Invite tes coéquipiers' : 'Invite your teammates'}
                      </p>
                      <p className="mt-2 text-[12px] leading-relaxed text-fg/60">
                        {lang === 'fr'
                          ? 'Personne d’autre de ton club n’a encore rejoint le classement. Le tableau apparaît dès qu’un coéquipier accepte d’être visible.'
                          : 'Nobody else from your club has joined yet. The board shows up as soon as a teammate opts in.'}
                      </p>
                    </div>
                  }
                />

                <DuelsSection
                  duels={duels}
                  candidates={duelCandidates}
                  onChallenge={challengeAthlete}
                  onRespond={respondToDuel}
                  lang={lang}
                />
              </>
            )}

            <Link
              to="/profile#social"
              data-testid="squad-visibility-link"
              className="flex items-center justify-between rounded-2xl border border-paper-deep bg-paper-soft px-3.5 py-2.5 text-[12px] font-bold text-fg transition-colors hover:border-brand rf-focus-ring"
            >
              <span>
                {lang === 'fr' ? 'Gérer ma visibilité' : 'Manage my visibility'}
              </span>
              <Icon name="chevron-right" size={14} strokeWidth={2} />
            </Link>
          </>
        )}
      </main>

    </div>
  )
}
