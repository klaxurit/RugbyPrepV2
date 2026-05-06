import { Link } from 'react-router-dom'
import { Icon } from '../ui'
import type { CalendarEvent } from '../../types/training'

interface HeroDayAfterProps {
  /** Le match passé (≤ 48h) qui déclenche ce variant. */
  match: CalendarEvent
  /**
   * Score du match si connu (à venir : API FFR). Si absent, on n'affiche pas
   * le bloc score géant — la carte reste centrée sur la citation et le CTA récup.
   */
  score?: { home: number; away: number }
}

function formatMatchMeta(event: CalendarEvent): string {
  const date = new Date(`${event.date}T12:00:00`)
  const dayLabel = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  const venueLabel = event.is_neutral ? 'Neutre' : event.is_home ? 'Domicile' : 'Extérieur'
  const opponent = event.opponent ?? 'Adversaire'
  return `vs. ${opponent} · ${dayLabel} · ${venueLabel}`
}

/**
 * Hero "lendemain de match" — carte bordeaux pleine, score géant (si connu),
 * citation italic Playfair, stats inline, CTA "Récup active du jour".
 *
 * Affiché tant que le dernier match a eu lieu dans les 48 dernières heures.
 */
export function HeroDayAfter({ match, score }: HeroDayAfterProps) {
  const isHome = match.is_home === true
  const venueLabel = match.is_neutral ? 'Neutre' : isHome ? 'Dom.' : 'Ext.'
  // Résultat : V/N/D si on a un score, sinon '—'
  const result = score ? (score.home > score.away ? 'V' : score.home < score.away ? 'D' : 'N') : '—'
  const diff = score ? (score.home - score.away >= 0 ? `+${score.home - score.away}` : `${score.home - score.away}`) : '—'

  return (
    <div className="px-[18px]">
      <div
        className="relative overflow-hidden rounded-[24px] bg-brand text-app px-[22px] pt-[22px] pb-5"
        style={{ boxShadow: '0 24px 50px -20px rgba(123, 13, 30, 0.5)' }}
      >
        {/* Texture radiale subtile */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 90% 0%, rgba(245, 242, 238, 0.15) 0%, transparent 50%), radial-gradient(circle at 0% 100%, rgba(245, 242, 238, 0.08) 0%, transparent 50%)',
          }}
        />

        <div className="relative">
          {/* Eyebrow + pastille pulsante */}
          <div className="mb-3.5 flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full animate-rf-pulse"
              style={{ background: '#5FBE7D' }}
            />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] opacity-90">
              {score ? (
                result === 'V'
                  ? 'Lendemain de match · Victoire'
                  : result === 'D'
                    ? 'Lendemain de match · Défaite'
                    : 'Lendemain de match · Nul'
              ) : (
                'Lendemain de match'
              )}
            </span>
          </div>

          {/* Score géant — affiché uniquement si on a la data */}
          {score && (
            <div className="mb-1 flex items-baseline gap-4">
              <div
                className="font-extrabold tabular-nums leading-[0.9]"
                style={{ fontSize: 68, letterSpacing: -3 }}
              >
                {score.home}
                <span className="mx-2.5 opacity-45 font-light">—</span>
                <span className="font-medium opacity-70">{score.away}</span>
              </div>
            </div>
          )}

          <div className="mb-[18px] text-[13px] font-semibold opacity-85" style={{ letterSpacing: '0.3px' }}>
            {formatMatchMeta(match)}
          </div>

          {/* Citation éditoriale Playfair */}
          <h1
            className="mb-[18px] font-serif italic font-medium text-[22px] leading-[1.2] [text-wrap:balance]"
            style={{ letterSpacing: '-0.5px' }}
          >
            Bien joué.
            <br />
            <span className="opacity-70">Maintenant, on récupère.</span>
          </h1>

          {/* Stats : Écart / Résultat / Lieu (placeholders '—' si pas de score) */}
          <div
            className="mb-[18px] grid grid-cols-3 gap-px overflow-hidden rounded-xl"
            style={{ background: 'rgba(245, 242, 238, 0.12)' }}
          >
            <Stat value={diff} label="Écart" />
            <Stat value={result} label="Résultat" tone={result === 'V' ? 'green' : 'default'} />
            <Stat value={venueLabel} label={isHome ? 'À domicile' : 'À l’extérieur'} />
          </div>

          {/* CTA récup active */}
          <Link
            to="/mobility"
            className="flex w-full items-center justify-between rounded-xl bg-app text-brand px-4 py-3.5 text-[13px] font-extrabold uppercase tracking-[0.04em] active:scale-[0.98] transition-transform rf-focus-ring"
          >
            <span className="inline-flex items-center gap-2.5">
              <Icon name="leaf" size={14} strokeWidth={2.4} />
              Récup active du jour
            </span>
            <Icon name="arrow-right" size={14} strokeWidth={2.4} />
          </Link>
        </div>
      </div>
    </div>
  )
}

interface StatProps {
  value: string
  label: string
  tone?: 'default' | 'green'
}

function Stat({ value, label, tone = 'default' }: StatProps) {
  return (
    <div className="bg-brand py-3 text-center">
      <div
        className="text-[22px] font-extrabold tabular-nums"
        style={{
          letterSpacing: '-0.6px',
          color: tone === 'green' ? '#5FBE7D' : 'var(--color-bg-app)',
        }}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.14em] opacity-65">
        {label}
      </div>
    </div>
  )
}
