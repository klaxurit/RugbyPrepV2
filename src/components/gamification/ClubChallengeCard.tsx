import { Shield } from 'lucide-react'
import type { Lang } from '../../i18n/appLabels'
import type { ClubChallenge } from '../../types/gamification'

export interface ClubChallengeCardProps {
  challenge: ClubChallenge
  lang: Lang
}

/**
 * Défi collectif du club.
 *
 * Contrepoids nécessaire au classement : un objectif coopératif entretient la
 * pression sociale sans dresser les coéquipiers les uns contre les autres.
 * L'avancement est agrégé, jamais nominatif — personne n'est désigné comme le
 * maillon faible.
 */
export function ClubChallengeCard({ challenge, lang }: ClubChallengeCardProps) {
  const ratio =
    challenge.target > 0 ? Math.min(1, challenge.current / challenge.target) : 0
  const reached = challenge.target > 0 && challenge.current >= challenge.target

  return (
    <section
      data-testid="club-challenge-card"
      className="rounded-[20px] border border-paper-deep bg-paper-soft px-[18px] py-4"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
          <Shield className="h-4 w-4" strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-fg/45">
            {lang === 'fr' ? 'Défi du club' : 'Club challenge'}
          </p>
          <p className="text-[13px] font-bold leading-tight text-fg">
            {lang === 'fr'
              ? `${challenge.current} séances sur ${challenge.target}`
              : `${challenge.current} of ${challenge.target} sessions`}
          </p>
        </div>
        <span className="shrink-0 text-[11px] font-black tabular-nums text-brand">
          {Math.round(ratio * 100)}%
        </span>
      </div>

      <div
        className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-paper-deep"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={challenge.target}
        aria-valuenow={challenge.current}
        aria-label={lang === 'fr' ? 'Avancement du défi de club' : 'Club challenge progress'}
      >
        <div
          className={`h-full rounded-full ${reached ? 'bg-ok' : 'bg-brand'}`}
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </div>

      <p className="mt-2 text-[10px] font-semibold leading-relaxed text-fg/50">
        {reached
          ? lang === 'fr'
            ? `Objectif atteint par les ${challenge.participantCount} joueurs engagés.`
            : `Target reached by the ${challenge.participantCount} players taking part.`
          : lang === 'fr'
            ? `${challenge.participantCount} joueurs engagés cette semaine. Objectif proportionnel à l’effectif.`
            : `${challenge.participantCount} players taking part this week. Target scales with the squad.`}
      </p>
    </section>
  )
}
