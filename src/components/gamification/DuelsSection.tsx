import { useState } from 'react'
import { Swords } from 'lucide-react'
import { SectionLabel } from '../ui'
import { levelLabel } from '../../services/gamification/labels'
import type { DuelCandidate } from '../../hooks/useSquad'
import type { Lang } from '../../i18n/appLabels'
import type { Duel } from '../../types/gamification'

export interface DuelsSectionProps {
  duels: readonly Duel[]
  candidates: readonly DuelCandidate[]
  onChallenge: (opponentId: string) => void
  onRespond: (duelId: string, accept: boolean) => void
  lang: Lang
}

/**
 * Duels hebdomadaires entre coéquipiers.
 *
 * La confrontation directe n'est proposée qu'à ceux qui la demandent :
 * l'invitation doit être acceptée, et un refus n'a aucun coût. Enrôler
 * automatiquement deux athlètes dans un duel produirait exactement les
 * dynamiques sociales négatives qu'on cherche à éviter.
 */
export function DuelsSection({
  duels,
  candidates,
  onChallenge,
  onRespond,
  lang,
}: DuelsSectionProps) {
  const [pickerOpen, setPickerOpen] = useState(false)

  const invitations = duels.filter((duel) => duel.status === 'pending' && !duel.isChallenger)
  const active = duels.filter((duel) => duel.status === 'active' || duel.status === 'completed')
  const sent = duels.filter((duel) => duel.status === 'pending' && duel.isChallenger)

  return (
    <section data-testid="duels-section">
      <SectionLabel label={lang === 'fr' ? 'Duels' : 'Duels'} />

      <div className="mt-3 space-y-2">
        {invitations.map((duel) => (
          <div
            key={duel.id}
            data-testid="duel-invitation"
            className="rounded-2xl border border-brand bg-brand-soft px-3.5 py-3"
          >
            <p className="text-[12px] font-bold text-fg">
              {lang === 'fr'
                ? `${duel.opponentDisplayName} te propose un duel cette semaine.`
                : `${duel.opponentDisplayName} challenged you this week.`}
            </p>
            <div className="mt-2.5 flex gap-2">
              <button
                type="button"
                onClick={() => onRespond(duel.id, true)}
                className="flex-1 rounded-xl bg-brand px-3 py-2 text-[12px] font-bold text-on-brand rf-focus-ring"
              >
                {lang === 'fr' ? 'Accepter' : 'Accept'}
              </button>
              <button
                type="button"
                onClick={() => onRespond(duel.id, false)}
                className="rounded-xl border border-border-app px-3 py-2 text-[12px] font-bold text-fg-muted rf-focus-ring"
              >
                {lang === 'fr' ? 'Refuser' : 'Decline'}
              </button>
            </div>
          </div>
        ))}

        {active.map((duel) => {
          const leading = duel.selfPoints > duel.opponentPoints
          const level = duel.selfPoints === duel.opponentPoints
          return (
            <div
              key={duel.id}
              data-testid="duel-active"
              className="flex items-center gap-3 rounded-2xl border border-paper-deep bg-paper-soft px-3.5 py-3"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <Swords className="h-4 w-4" strokeWidth={2.2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-fg">
                  {lang === 'fr' ? 'vs ' : 'vs '}
                  {duel.opponentDisplayName}
                </p>
                <p className="text-[10px] font-semibold text-fg/50">
                  {duel.status === 'completed'
                    ? lang === 'fr'
                      ? 'Terminé'
                      : 'Finished'
                    : level
                      ? lang === 'fr'
                        ? 'À égalité'
                        : 'Level'
                      : leading
                        ? lang === 'fr'
                          ? 'Tu mènes'
                          : "You're ahead"
                        : lang === 'fr'
                          ? 'Au coude à coude'
                          : 'Close call'}
                </p>
              </div>
              <span className="shrink-0 text-[13px] font-black tabular-nums text-fg">
                {duel.selfPoints}
                <span className="mx-1 text-fg/35">–</span>
                {duel.opponentPoints}
              </span>
            </div>
          )
        })}

        {sent.map((duel) => (
          <p
            key={duel.id}
            data-testid="duel-sent"
            className="rounded-2xl border border-dashed border-fg/25 px-3.5 py-3 text-[12px] text-fg/60"
          >
            {lang === 'fr'
              ? `Invitation envoyée à ${duel.opponentDisplayName}. En attente de sa réponse.`
              : `Invite sent to ${duel.opponentDisplayName}. Waiting for their answer.`}
          </p>
        ))}

        {duels.length === 0 && !pickerOpen && (
          <p className="text-[12px] leading-relaxed text-fg/60">
            {lang === 'fr'
              ? 'Aucun duel cette semaine. Un duel se joue sur les points de rigueur, pas sur le volume.'
              : 'No duel this week. A duel is played on rigor points, not on volume.'}
          </p>
        )}

        {candidates.length > 0 && !pickerOpen && (
          <button
            type="button"
            data-testid="duel-open-picker"
            onClick={() => setPickerOpen(true)}
            className="w-full rounded-2xl border border-paper-deep bg-paper px-3.5 py-2.5 text-[12px] font-bold text-fg transition-colors hover:border-brand rf-focus-ring"
          >
            {lang === 'fr' ? 'Défier un coéquipier' : 'Challenge a teammate'}
          </button>
        )}

        {pickerOpen && (
          <ul className="space-y-1.5" data-testid="duel-candidates">
            {candidates.map((candidate) => (
              <li key={candidate.userId}>
                <button
                  type="button"
                  onClick={() => {
                    onChallenge(candidate.userId)
                    setPickerOpen(false)
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-paper-deep bg-paper-soft px-3.5 py-2.5 text-left transition-colors hover:border-brand rf-focus-ring"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-bold text-fg">
                      {candidate.displayName}
                    </span>
                    <span className="block text-[10px] font-semibold text-fg/50">
                      {levelLabel(candidate.level, lang)}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] font-extrabold uppercase tracking-[0.1em] text-brand">
                    {lang === 'fr' ? 'Défier' : 'Challenge'}
                  </span>
                </button>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="w-full px-3.5 py-2 text-[11px] font-bold text-fg-muted rf-focus-ring"
              >
                {lang === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
            </li>
          </ul>
        )}
      </div>
    </section>
  )
}
