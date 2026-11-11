import { useState } from 'react'
import type { Lang } from '../../i18n/appLabels'

export interface CompetitionPauseCardProps {
  active: boolean
  /** Conservé pour compat API ; plus affiché (pause ouverte jusqu’à levée manuelle). */
  endsOn: string | null
  onToggle: (active: boolean) => Promise<boolean>
  lang: Lang
}

/**
 * Déclaration compacte de pause compétition (« Blessé »).
 *
 * Explicitement **non médical** : gèle seulement les malus / relégations
 * d'inactivité de la ligue. Aucune localisation ni diagnostic.
 */
export function CompetitionPauseCard({
  active,
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
      className="flex items-center gap-3 rounded-[14px] border border-paper-deep bg-paper-soft px-3.5 py-2.5"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-extrabold leading-snug text-fg">
          {lang === 'fr' ? 'Blessé · pause ligue' : 'Injured · league pause'}
        </p>
        <p className="mt-0.5 text-[11px] leading-snug text-fg/60">
          {active
            ? lang === 'fr'
              ? 'Bouclier actif — tu ne descends pas pour inactivité.'
              : 'Shield on — no inactivity relegation.'
            : lang === 'fr'
              ? 'Bouclier anti-relégation. Pas un suivi médical.'
              : 'Anti-relegation shield. Not medical tracking.'}
        </p>
      </div>
      <button
        type="button"
        data-testid="competition-pause-toggle"
        disabled={busy}
        onClick={() => void handleClick()}
        className={`shrink-0 rounded-xl px-3 py-2 text-[12px] font-extrabold transition-colors rf-focus-ring ${
          active
            ? 'border border-border-app bg-layer-6 text-fg'
            : 'bg-brand text-on-brand'
        } disabled:opacity-60`}
      >
        {busy
          ? '…'
          : active
            ? lang === 'fr'
              ? 'Lever'
              : 'End'
            : lang === 'fr'
              ? 'Activer'
              : 'Activate'}
      </button>
    </section>
  )
}
