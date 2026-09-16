import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { Icon, Pill, SectionLabel } from '../ui'
import { levelLabel } from '../../services/gamification/labels'
import { buildScoreBreakdownRows } from '../../services/gamification/scoreBreakdownRows'
import type { LevelProgress } from '../../services/gamification/levels'
import type { Lang } from '../../i18n/appLabels'
import type { GamificationProfile, WeeklyScore } from '../../types/gamification'

export interface RigorScoreCardProps {
  profile: GamificationProfile | null
  currentWeek: WeeklyScore | null
  levelProgress: LevelProgress
  lang: Lang
}

/**
 * Carte « Score de rigueur » de l'accueil.
 *
 * Affiche le détail poste par poste plutôt qu'un total seul : un score opaque
 * ne dit pas à l'athlète quoi faire, alors que « repos prescrit : +10 » lui
 * apprend que le repos rapporte. C'est ce détail qui empêche le système d'être
 * lu comme une prime au volume.
 */
export function RigorScoreCard({
  profile,
  currentWeek,
  levelProgress,
  lang,
}: RigorScoreCardProps) {
  // Sans profil de gamification ni score, il n'y a rien de vrai à afficher.
  // On préfère ne rien monter à un état vide décoratif.
  if (!profile && !currentWeek) return null

  const points = currentWeek?.points ?? 0
  const rows = currentWeek ? buildScoreBreakdownRows(currentWeek, lang) : []
  const streak = profile?.currentWeekStreak ?? 0

  return (
    <section className="px-[22px] pt-6" data-testid="rigor-score-card">
      <SectionLabel label={lang === 'fr' ? 'Ta rigueur' : 'Your rigor'} />

      <div className="mt-3 rounded-[20px] border border-paper-deep bg-paper-soft px-[22px] py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fg/55">
              {lang === 'fr' ? 'Cette semaine' : 'This week'}
            </p>
            <p className="mt-1 text-[34px] font-black leading-none tabular-nums text-fg">
              {points}
              <span className="ml-1.5 text-[13px] font-bold text-fg/55">
                {lang === 'fr' ? 'pts' : 'pts'}
              </span>
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <Pill tone="gold" size="sm">
              {levelLabel(levelProgress.level, lang)}
            </Pill>
            {streak > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-pro tabular-nums">
                <Icon name="flame" size={11} strokeWidth={2.4} />
                {streak}
                {lang === 'fr'
                  ? streak > 1
                    ? ' semaines'
                    : ' semaine'
                  : streak > 1
                    ? ' weeks'
                    : ' week'}
              </span>
            )}
          </div>
        </div>

        {/* Progression vers le palier suivant. Au dernier niveau, la barre
            n'a plus de sens : on n'affiche rien plutôt qu'une barre pleine
            sans horizon. */}
        {levelProgress.nextLevel && levelProgress.xpForLevel != null && (
          <div className="mt-4">
            <div className="flex items-baseline justify-between text-[10px] font-bold text-fg/55">
              <span>
                {lang === 'fr' ? 'Vers ' : 'To '}
                {levelLabel(levelProgress.nextLevel, lang)}
              </span>
              <span className="tabular-nums">
                {levelProgress.xpIntoLevel} / {levelProgress.xpForLevel}
              </span>
            </div>
            <div
              className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-paper-deep"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={levelProgress.xpForLevel}
              aria-valuenow={levelProgress.xpIntoLevel}
              aria-label={lang === 'fr' ? 'Progression de niveau' : 'Level progress'}
            >
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: `${Math.round(levelProgress.ratio * 100)}%` }}
              />
            </div>
          </div>
        )}

        {rows.length > 0 && (
          <ul className="mt-4 space-y-1.5 border-t border-paper-deep pt-3">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex items-baseline justify-between gap-2 text-[12px]"
              >
                <span className="min-w-0 truncate text-fg/70">{row.label}</span>
                <span className="font-bold tabular-nums text-fg">+{row.points}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Gel des gains en surcharge : on l'explique, sinon l'athlète voit un
            score amputé sans savoir pourquoi et soupçonne un bug. */}
        {currentWeek?.acwrCapped && (
          <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-warn-body">
            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-warn" />
            <span>
              {lang === 'fr'
                ? 'Charge en zone de surcharge : les séances hors plan ne rapportent rien cette semaine. Tenir le plan reste payant.'
                : 'Load in the overload zone: off-plan sessions earn nothing this week. Sticking to the plan still pays.'}
            </span>
          </p>
        )}

        {currentWeek?.deloadRespected && (
          <p className="mt-3 text-[11px] leading-relaxed text-ok">
            {lang === 'fr'
              ? 'Semaine de décharge tenue : elle rapporte autant qu’une semaine de charge.'
              : 'Deload week respected: it pays as much as a loading week.'}
          </p>
        )}

        <Link
          to="/squad"
          data-testid="rigor-score-squad-link"
          className="mt-4 flex items-center justify-between rounded-2xl border border-paper-deep bg-paper px-3.5 py-2.5 text-[12px] font-bold text-fg transition-colors hover:border-brand rf-focus-ring"
        >
          <span>{lang === 'fr' ? 'Voir mon groupe' : 'See my squad'}</span>
          <Icon name="chevron-right" size={14} strokeWidth={2} />
        </Link>
      </div>
    </section>
  )
}
