import { Icon, SectionLabel, Pill } from '../ui'
import { ClubAvatar } from '../match/ClubAvatar'
import type { CalendarEvent } from '../../types/training'

interface NextMatchEditorialCardProps {
  event: CalendarEvent
  /** Différence en jours (>= 0). Calculée par le caller pour rester pur. */
  daysUntil: number
  /** Callback au clic sur la carte (ouvre le MatchEditDrawer). */
  onClick?: () => void
}

const KICKOFF_FALLBACK = '—'

function formatKickoff(event: CalendarEvent): string {
  const d = new Date(`${event.date}T12:00:00`)
  const day = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
  if (!event.kickoff_time) return day
  // Ex: "Sam. 9 mai · 16h"
  const [hh] = event.kickoff_time.split(':')
  const hour = Number.parseInt(hh, 10)
  return Number.isFinite(hour) ? `${day} · ${hour}h` : `${day} · ${event.kickoff_time}`
}

/**
 * Carte "Prochain match" — variante éditoriale Home.
 * J−X géant + adversaire + pill domicile/extérieur + chevron.
 */
export function NextMatchEditorialCard({
  event,
  daysUntil,
  onClick,
}: NextMatchEditorialCardProps) {
  const isHome = event.is_home === true
  const venueLabel = event.is_neutral ? 'Neutre' : isHome ? 'Domicile' : 'Extérieur'
  const venueIcon = isHome ? 'home' : 'arrow-right'
  const opponentLabel = event.opponent ?? 'Adversaire à confirmer'

  return (
    <section className="px-[22px] pt-6">
      <SectionLabel label="Prochain match" />

      <button
        type="button"
        onClick={onClick}
        className="mt-3 block w-full rounded-[20px] border-[1.5px] border-fg bg-app px-[22px] py-5 text-left active:scale-[0.99] transition-transform rf-focus-ring"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-brand mb-1">
              Dans
            </div>
            <div
              className="text-[64px] font-extrabold leading-[0.85] tabular-nums text-fg"
              style={{ letterSpacing: '-3px' }}
            >
              {daysUntil === 0 ? (
                <>
                  J<span className="text-brand">+</span>0
                </>
              ) : (
                <>
                  J<span className="text-brand">−</span>
                  {daysUntil}
                </>
              )}
            </div>
          </div>
          <div className="text-right">
            <Pill tone="ink" size="sm">
              <Icon name={venueIcon} size={11} strokeWidth={2.2} />
              {venueLabel}
            </Pill>
            <div className="mt-2 text-[11px] font-bold text-fg/55 tabular-nums">
              {formatKickoff(event) || KICKOFF_FALLBACK}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3.5 border-t border-paper-deep pt-4">
          <ClubAvatar code={event.opponent_code} name={event.opponent} size="md" />
          <div className="min-w-0 flex-1">
            <div className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-fg/50">
              vs.
            </div>
            <div
              className="mt-0.5 truncate text-[15px] font-bold text-fg"
              style={{ letterSpacing: '-0.3px' }}
            >
              {opponentLabel}
            </div>
          </div>
          <Icon name="chevron-right" size={18} color="var(--color-text-primary)" strokeWidth={2} />
        </div>
      </button>
    </section>
  )
}
