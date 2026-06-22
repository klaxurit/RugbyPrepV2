import type { AthleteWeeklyMotherSessionSummary } from '../../types/staffPlanning'
import type { StaffRosterTheme } from './StaffRosterTable'

export interface AthleteMotherSessionsPreviewProps {
  motherSessions: AthleteWeeklyMotherSessionSummary
  theme?: StaffRosterTheme
}

export function AthleteMotherSessionsPreview({
  motherSessions,
  theme = 'app',
}: AthleteMotherSessionsPreviewProps) {
  const { sessionTitles, companionRecommendations, warnings, status } = motherSessions
  const isDark = theme === 'dark'

  const wrapClass = isDark
    ? 'rounded-lg border border-white/10 bg-black/20 text-neutral-200'
    : 'rounded-lg border border-brand-border bg-layer-10 text-fg'
  const accentClass = isDark ? 'text-[#ff6b35]' : 'text-brand'
  const statusClass = isDark
    ? 'border-white/15 text-neutral-400'
    : 'border-brand-border text-fg-muted'
  const listClass = isDark ? 'text-neutral-100' : 'text-fg'
  const mutedClass = isDark ? 'text-neutral-500' : 'text-fg-muted'
  const recClass = isDark ? 'text-neutral-300' : 'text-fg-muted'
  const warnClass = isDark ? 'text-amber-100/90' : 'text-amber-800'
  const warnLabel = isDark ? 'text-amber-500/80' : 'text-amber-700'

  return (
    <div className={`p-3 text-xs ${wrapClass}`}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className={`font-semibold ${accentClass}`}>Séances (aperçu)</span>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase ${statusClass}`}>
          {status.replace(/_/g, ' ')}
        </span>
      </div>

      {sessionTitles.length > 0 ? (
        <ul className={`m-0 mb-2 list-disc space-y-1 pl-4 ${listClass}`}>
          {sessionTitles.slice(0, 6).map((t, i) => (
            <li key={i}>{t}</li>
          ))}
          {sessionTitles.length > 6 && (
            <li className={mutedClass}>+{sessionTitles.length - 6} autres…</li>
          )}
        </ul>
      ) : (
        <p className={`m-0 mb-2 ${mutedClass}`}>Aucun titre résolu</p>
      )}

      {companionRecommendations.length > 0 && (
        <div className="mb-2">
          <div className={`mb-1 text-[10px] font-semibold uppercase tracking-wide ${mutedClass}`}>
            Recommandations
          </div>
          <ul className={`m-0 list-disc space-y-0.5 pl-4 ${recClass}`}>
            {companionRecommendations.slice(0, 3).map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div>
          <div className={`mb-1 text-[10px] font-semibold uppercase tracking-wide ${warnLabel}`}>
            Avertissements resolver
          </div>
          <ul className={`m-0 list-disc space-y-0.5 pl-4 ${warnClass}`}>
            {warnings.slice(0, 3).map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
