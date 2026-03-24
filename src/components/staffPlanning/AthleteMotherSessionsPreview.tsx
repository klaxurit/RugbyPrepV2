import type { AthleteWeeklyMotherSessionSummary } from '../../types/staffPlanning'

const accent = '#ff6b35'

export interface AthleteMotherSessionsPreviewProps {
  motherSessions: AthleteWeeklyMotherSessionSummary
}

export function AthleteMotherSessionsPreview({ motherSessions }: AthleteMotherSessionsPreviewProps) {
  const { sessionTitles, companionRecommendations, warnings, status } = motherSessions

  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-neutral-200">
      <div className="mb-2 flex items-center gap-2">
        <span className="font-semibold" style={{ color: accent }}>
          Séances (aperçu)
        </span>
        <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] uppercase text-neutral-400">
          {status.replace(/_/g, ' ')}
        </span>
      </div>

      {sessionTitles.length > 0 ? (
        <ul className="m-0 mb-2 list-disc space-y-1 pl-4 text-neutral-100">
          {sessionTitles.slice(0, 6).map((t, i) => (
            <li key={i}>{t}</li>
          ))}
          {sessionTitles.length > 6 && (
            <li className="text-neutral-500">+{sessionTitles.length - 6} autres…</li>
          )}
        </ul>
      ) : (
        <p className="m-0 mb-2 text-neutral-500">Aucun titre résolu</p>
      )}

      {companionRecommendations.length > 0 && (
        <div className="mb-2">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
            Recommandations
          </div>
          <ul className="m-0 list-disc space-y-0.5 pl-4 text-neutral-300">
            {companionRecommendations.slice(0, 3).map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div>
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-amber-500/80">
            Avertissements resolver
          </div>
          <ul className="m-0 list-disc space-y-0.5 pl-4 text-amber-100/90">
            {warnings.slice(0, 3).map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
