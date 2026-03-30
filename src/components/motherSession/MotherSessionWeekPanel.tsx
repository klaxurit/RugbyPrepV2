import { useMemo } from 'react'
import { Layers, AlertTriangle } from 'lucide-react'
import type { ResolvedMotherSessionSlot } from '../../services/motherSession/resolveMotherSessionsForWeek'
import type { AppLang } from '../../services/motherSession/motherSessionLabels'
import { msLabel } from '../../services/motherSession/motherSessionLabels'
import type { SCSchedule, ClubSchedule } from '../../types/training'
import { mapSlotsToScheduleDays } from '../../services/ui/mapSlotsToScheduleDays'
import { formatTitleFromMotherSessionId } from './formatMotherSessionTitle'

const ROLE_FR: Record<ResolvedMotherSessionSlot['role'], string> = {
  primary: 'Principale',
  secondary: 'Secondaire',
  optional: 'Optionnelle',
}

const SESSION_BADGE_LABELS: Record<string, Record<AppLang, string>> = {
  upper: { fr: 'HAUT', en: 'UPPER' },
  lower: { fr: 'BAS', en: 'LOWER' },
  full: { fr: 'COMPLET', en: 'FULL' },
  full_light_primer: { fr: 'PRIMER', en: 'PRIMER' },
  speed_power: { fr: 'VITESSE', en: 'SPEED' },
}

function getSessionBadgeLabel(type: string, lang: AppLang): string {
  return SESSION_BADGE_LABELS[type]?.[lang] ?? (lang === 'fr' ? 'SÉANCE' : 'SESSION')
}

type MotherSessionWeekPanelProps = {
  sessions: ResolvedMotherSessionSlot[]
  warnings: string[]
  companionRecommendations?: string[]
  status: 'resolved' | 'resolved_with_warnings' | 'missing_session'
  missingMessage?: string
  scSchedule?: SCSchedule
  clubSchedule?: ClubSchedule
  lang?: AppLang
  /** Called when a session card is tapped; receives the slot index. */
  onSessionSelect?: (index: number) => void
}

export function MotherSessionWeekPanel({
  sessions,
  warnings,
  companionRecommendations,
  status,
  missingMessage,
  scSchedule,
  clubSchedule,
  lang = 'fr',
  onSessionSelect,
}: MotherSessionWeekPanelProps) {
  const dayMappings = useMemo(
    () => mapSlotsToScheduleDays(sessions, scSchedule, clubSchedule?.matchDay),
    [sessions, scSchedule, clubSchedule],
  )

  if (status === 'missing_session') {
    return (
      <section
        className="rounded-[24px] border border-rose-500/30 bg-rose-900/15 p-4 space-y-2"
        data-testid="mother-session-week-missing"
      >
        <p className="flex items-center gap-2 text-sm font-black text-rose-300">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden />
          {msLabel('sessions_unavailable', lang)}
        </p>
        <p className="text-xs text-white/70 leading-relaxed">
          {missingMessage ??
            'Certaines séances ne sont pas encore disponibles dans le jeu de données. Réessaie après une mise à jour de l\'app.'}
        </p>
        {warnings.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs text-rose-200/80">
            {warnings.slice(0, 8).map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        )}
      </section>
    )
  }

  return (
    <section className="space-y-4" data-testid="mother-session-week-panel">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff6b35]/15 text-[#ff6b35]">
          <Layers className="h-4 w-4" aria-hidden />
        </div>
        <h3 className="text-sm font-black text-white">{msLabel('sessions_of_week', lang)}</h3>
      </div>

      {warnings.length > 0 && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-900/10 px-3 py-2 text-xs text-amber-200/90 space-y-1">
          {warnings.slice(0, 6).map((w) => (
            <p key={w} className="leading-snug">
              · {w}
            </p>
          ))}
        </div>
      )}

      {companionRecommendations && companionRecommendations.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/65 space-y-1">
          <p className="text-[10px] font-black uppercase text-white/40">{msLabel('out_of_gym', lang)}</p>
          {companionRecommendations.map((c) => (
            <p key={c}>· {c}</p>
          ))}
        </div>
      )}

      {sessions.length > 0 && (
        <div className="space-y-2" data-testid="week-session-list">
          {sessions.map((slot, i) => {
            const title = formatTitleFromMotherSessionId(slot.session.metadata.id, lang)
            const dayLabel = dayMappings[i]?.label ?? (slot.dayPreference === 'early_week'
              ? msLabel('session_early_week', lang)
              : slot.dayPreference === 'mid_week'
                ? msLabel('session_mid_week', lang)
                : slot.dayPreference === 'late_week'
                  ? msLabel('session_late_week', lang)
                  : ROLE_FR[slot.role])
            const badgeLabel = getSessionBadgeLabel(slot.session.metadata.sessionType, lang)

            return (
              <button
                key={`${slot.sessionId}-${i}`}
                type="button"
                data-testid={`week-session-card-${i}`}
                onClick={() => onSessionSelect?.(i)}
                className="w-full flex items-center gap-4 bg-white/5 border border-white/10 rounded-[2rem] p-4 hover:border-white/20 hover:bg-white/[0.07] transition-all text-left"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl flex flex-col items-center justify-center bg-[#ff6b35]/10">
                  <span className="text-[10px] font-black tracking-wide text-[#ff6b35]">
                    {dayLabel}
                  </span>
                  <span className="text-[8px] font-bold text-[#ff6b35]/60 uppercase">
                    {badgeLabel}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-white text-sm truncate">{title}</h4>
                  <p className="text-xs text-white/40 mt-0.5">
                    {slot.session.blocks.length} blocs
                    {slot.variant === 'light' ? ' · léger' : ''}
                    {slot.maxBlocks != null ? ` · max ${slot.maxBlocks}` : ''}
                  </p>
                </div>
                <svg className="w-5 h-5 text-white/30 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )
          })}
        </div>
      )}

      {status === 'resolved_with_warnings' && warnings.length === 0 && (
        <p className="text-[10px] text-white/35 text-center">Résolution avec recommandations compagnon.</p>
      )}
    </section>
  )
}
