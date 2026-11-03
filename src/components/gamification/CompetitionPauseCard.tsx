import { useState } from 'react'
import type { Lang } from '../../i18n/appLabels'
import { COMPETITION_PAUSE_MAX_DAYS } from '../../services/gamification/competitionPause'

export interface CompetitionPauseCardProps {
  active: boolean
  endsOn: string | null
  onToggle: (active: boolean) => Promise<boolean>
  lang: Lang
}

/**
 * Déclaration de pause compétition (« Blessé »).
 *
 * Explicitement **non médical** : gèle seulement les malus / relégations
 * d'inactivité de la ligue. Aucune localisation ni diagnostic.
 */
export function CompetitionPauseCard({
  active,
  endsOn,
  onToggle,
  lang,
}: CompetitionPauseCardProps) {
  const [busy, setBusy] = useState(false)

  const handleClick = async () => {
    if (busy) return
    setBusy(true)
    try {
      await onToggle(!active)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section
      data-testid="competition-pause-card"
      data-pause-active={active ? 'true' : 'false'}
      className="rounded-[20px] border border-paper-deep bg-paper-soft px-[18px] py-4"
    >
      <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-fg/45">
        {lang === 'fr' ? 'Pause ligue' : 'League pause'}
      </p>
      <p className="mt-1 text-[15px] font-black text-fg">
        {lang === 'fr' ? 'Se déclarer Blessé' : 'Declare Injured pause'}
      </p>
      <p className="mt-1.5 text-[12px] leading-relaxed text-fg/65">
        {lang === 'fr'
          ? `Pause compétition (max ${COMPETITION_PAUSE_MAX_DAYS} j.) : tu ne descends pas de division pour inactivité. Ce n’est pas un suivi médical — juste un bouclier ligue.`
          : `Competition pause (max ${COMPETITION_PAUSE_MAX_DAYS} days): no inactivity relegation. Not medical tracking — league shield only.`}
      </p>
      {active && endsOn && (
        <p className="mt-2 text-[11px] font-bold tabular-nums text-warn">
          {lang === 'fr' ? `Active jusqu’au ${endsOn}` : `Active until ${endsOn}`}
        </p>
      )}
      <button
        type="button"
        data-testid="competition-pause-toggle"
        disabled={busy}
        onClick={() => void handleClick()}
        className={`mt-3 w-full rounded-2xl px-4 py-2.5 text-[13px] font-extrabold transition-colors rf-focus-ring ${
          active
            ? 'border border-border-app bg-layer-6 text-fg'
            : 'bg-brand text-on-brand'
        } disabled:opacity-60`}
      >
        {busy
          ? lang === 'fr'
            ? '…'
            : '…'
          : active
            ? lang === 'fr'
              ? 'Lever la pause'
              : 'End pause'
            : lang === 'fr'
              ? 'Activer Blessé'
              : 'Activate Injured pause'}
      </button>
    </section>
  )
}
