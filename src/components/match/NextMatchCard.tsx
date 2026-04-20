import { Home, MapPin, Trophy } from 'lucide-react'
import type { CalendarEvent } from '../../types/training'
import { ClubAvatar } from './ClubAvatar'
import { diffDays, formatDateFR, formatDateFRShort } from './matchDate'

export type NextMatchCardVariant = 'upcoming' | 'past'
export type NextMatchCardSize = 'hero' | 'mini'

interface NextMatchCardProps {
  event: CalendarEvent
  /** 'upcoming' (défaut) = match à venir · 'past' = match joué (pill ambre). */
  variant?: NextMatchCardVariant
  /** 'hero' (défaut) = grande carte pleine page · 'mini' = ligne compacte. */
  size?: NextMatchCardSize
  /** Texte CTA affiché en bas (ex: "Enregistrer ma charge →"). */
  ctaLabel?: string
}

function resolveHeadline(event: CalendarEvent, isPast: boolean, short = false) {
  const days = diffDays(event.date)
  if (isPast) {
    if (days === 0) return short ? 'Auj.' : "Aujourd'hui"
    if (days === -1) return 'Hier'
    return short ? `J+${Math.abs(days)}` : `Il y a ${Math.abs(days)} jours`
  }
  if (days === 0) return short ? 'Auj.' : "Aujourd'hui !"
  if (days === 1) return 'Demain'
  return `J−${days}`
}

/**
 * Carte "Prochain match / Match joué" — visuel partagé entre /calendar, /home
 * et /week. Le wrapping <Link> reste à la charge de l'appelant.
 */
export function NextMatchCard({
  event,
  variant = 'upcoming',
  size = 'hero',
  ctaLabel,
}: NextMatchCardProps) {
  const isPast = variant === 'past'
  const pillColor = isPast ? 'bg-warn-strong' : 'bg-rose-600'
  const glowColor = isPast ? 'bg-warn-strong' : 'bg-rose-600'
  const pillLabel = isPast ? 'Match joué' : 'Prochain match'
  const headline = resolveHeadline(event, isPast, size === 'mini')

  if (size === 'mini') {
    // Ligne compacte : logo + headline/vs + meta + home/away icon.
    const accentText = isPast ? 'text-warn-strong' : 'text-rose-600'
    return (
      <div
        className="relative overflow-hidden rounded-2xl bg-panel border border-border-app shadow-sm px-3 py-2.5 flex items-center gap-2.5"
        aria-label={`${pillLabel}${event.opponent ? ` vs ${event.opponent}` : ''}`}
      >
        <ClubAvatar code={event.opponent_code} name={event.opponent} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="flex items-baseline gap-1.5 min-w-0">
            <Trophy className={`w-3 h-3 ${accentText} fill-current flex-shrink-0 self-center`} aria-hidden />
            <span className={`text-[11px] font-black uppercase tracking-wide ${accentText} flex-shrink-0`}>
              {headline}
            </span>
            {event.opponent && (
              <span className="text-[11px] font-bold text-fg truncate">
                · vs {event.opponent}
              </span>
            )}
          </p>
          <p className="text-[10px] text-fg-muted mt-0.5 truncate capitalize">
            {formatDateFRShort(event.date)}
            {event.kickoff_time ? ` · ${event.kickoff_time}` : ''}
          </p>
          {ctaLabel && (
            <p className="text-[10px] font-bold text-brand-tint mt-0.5">{ctaLabel}</p>
          )}
        </div>
        {event.is_home !== undefined && (
          <div
            className="flex-shrink-0 text-fg-muted"
            title={event.is_home ? 'Domicile' : 'Extérieur'}
            aria-label={event.is_home ? 'Domicile' : 'Extérieur'}
          >
            {event.is_home ? (
              <Home className="w-3.5 h-3.5" />
            ) : (
              <MapPin className="w-3.5 h-3.5" />
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-panel border border-border-app shadow-elevated p-6 space-y-3">
      <div className={`absolute top-0 right-0 w-28 h-28 ${glowColor} opacity-20 blur-3xl -mr-6 -mt-6`} />

      <div className="flex items-center justify-between">
        <div className={`inline-flex items-center gap-1.5 ${pillColor} px-3 py-1 rounded-full`}>
          <Trophy className="w-3 h-3 text-paper fill-current" />
          <span className="text-[10px] font-black text-paper uppercase tracking-widest">
            {pillLabel}
          </span>
        </div>
        {event.is_home !== undefined && (
          <div className="flex items-center gap-1 text-fg-muted">
            {event.is_home ? (
              <>
                <Home className="w-3 h-3" />
                <span className="text-[10px] font-bold">Domicile</span>
              </>
            ) : (
              <>
                <MapPin className="w-3 h-3" />
                <span className="text-[10px] font-bold">Extérieur</span>
              </>
            )}
          </div>
        )}
      </div>

      <div>
        <div className="text-4xl font-black text-fg leading-none">{headline}</div>
        <div className="text-sm font-bold text-fg mt-1.5 capitalize">{formatDateFR(event.date)}</div>
        {!isPast && event.kickoff_time && (
          <div className="text-sm font-bold text-rose-600 mt-0.5">
            Coup d'envoi {event.kickoff_time}
          </div>
        )}
      </div>

      {event.opponent && (
        <div className="flex items-center gap-2 text-fg">
          <ClubAvatar code={event.opponent_code} name={event.opponent} size="md" />
          <span className="font-bold">vs {event.opponent}</span>
        </div>
      )}

      {ctaLabel && (
        <p className="text-xs font-bold text-brand-tint pt-1">{ctaLabel}</p>
      )}
    </div>
  )
}
