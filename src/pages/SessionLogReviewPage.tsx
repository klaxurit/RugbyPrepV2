import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MOTHER_SESSIONS_BY_ID } from '../data/motherSessions.generated'
import { BottomNav } from '../components/BottomNav'
import { PageHeader } from '../components/PageHeader'
import { HeroCompleted } from '../components/session/blocks/HeroCompleted'
import { SessionLogReviewBlocks } from '../components/session/SessionLogReviewBlocks'
import { useExerciseSetLogs } from '../hooks/useExerciseSetLogs'
import { useHistory } from '../hooks/useHistory'
import { useProfile } from '../hooks/useProfile'
import { prepareSessionForRender } from '../services/session/prepareSessionForRender'
import {
  getSessionLogCycleLabel,
  getSessionLogDisplayTitle,
} from '../services/program/sessionLogPresentation'
import { formatTonnage } from '../services/home/formatTonnage'
import { tr, type Lang } from '../i18n/appLabels'

function formatShortDate(iso: string, lang: Lang): string {
  return new Date(iso).toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function SessionLogReviewPage() {
  const { logId } = useParams<{ logId: string }>()
  const navigate = useNavigate()
  const { logs } = useHistory()
  const { profile } = useProfile()
  const { getSetsForSessionLog } = useExerciseSetLogs()
  const lang = (profile.preferredLanguage as Lang | undefined) ?? 'fr'

  const log = useMemo(() => logs.find((l) => l.id === logId), [logs, logId])

  const motherSession = useMemo(() => {
    if (!log?.motherSessionId) return null
    return MOTHER_SESSIONS_BY_ID[log.motherSessionId] ?? null
  }, [log?.motherSessionId])

  const preparedSession = useMemo(() => {
    if (!motherSession) return null
    return prepareSessionForRender({
      session: motherSession,
      trainingLevel: profile.trainingLevel,
      equipment: profile.equipment,
      lang,
    })
  }, [motherSession, profile.trainingLevel, profile.equipment, lang])

  const sets = useMemo(
    () => (log ? getSetsForSessionLog(log) : []),
    [log, getSetsForSessionLog],
  )

  if (!log) {
    return (
      <div className="min-h-screen bg-app pb-bottom-nav">
        <PageHeader title={lang === 'fr' ? 'Séance' : 'Session'} backTo="/week" />
        <main className="px-6 pt-8 max-w-md mx-auto text-center">
          <p className="text-sm text-fg-muted">
            {lang === 'fr' ? 'Séance introuvable.' : 'Session not found.'}
          </p>
          <Link to="/week" className="mt-4 inline-block text-sm font-bold text-brand">
            {lang === 'fr' ? 'Retour à la semaine' : 'Back to week'}
          </Link>
        </main>
        <BottomNav />
      </div>
    )
  }

  const title = getSessionLogDisplayTitle(log, lang)
  const cyclePart = getSessionLogCycleLabel(log, lang)
  const pageTitle = lang === 'fr' ? 'Séance effectuée' : 'Completed session'

  const stats = [
    log.durationMin != null
      ? { value: `${log.durationMin}'`, label: lang === 'fr' ? 'Durée' : 'Duration' }
      : null,
    log.rpe != null ? { value: String(log.rpe), label: 'RPE' } : null,
    log.tonnageKg != null && log.tonnageKg > 0
      ? { value: formatTonnage(log.tonnageKg), label: lang === 'fr' ? 'Tonnage' : 'Tonnage' }
      : null,
  ].filter(Boolean) as { value: string; label: string }[]

  return (
    <div className="min-h-screen bg-app font-sans text-fg pb-bottom-nav">
      <PageHeader title={pageTitle} backTo="/week" />

      <main className="max-w-md mx-auto pb-6">
        <div className="px-4 pt-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-fg-muted">
            {formatShortDate(log.dateISO, lang)}
          </p>
          <h1 className="mt-1 text-xl font-extrabold text-fg">{title}</h1>
          {cyclePart ? <p className="mt-1 text-xs text-fg-muted">{cyclePart}</p> : null}
        </div>

        <HeroCompleted
          quote={
            lang === 'fr'
              ? 'Séance enregistrée.\nConsultation en lecture seule.'
              : 'Session logged.\nRead-only review.'
          }
          ghostNumber={preparedSession ? String(preparedSession.blocks.length) : undefined}
          stats={stats.length > 0 ? stats : undefined}
        />

        {log.notes ? (
          <div className="mx-[14px] mt-3 rounded-[16px] border border-border-app bg-layer-5 px-4 py-3">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-fg-muted">
              {tr('progress_modal_notes', lang)}
            </div>
            <p className="mt-1 text-sm text-fg italic">&quot;{log.notes}&quot;</p>
          </div>
        ) : null}

        {preparedSession ? (
          <div className="px-4 mt-4">
            <SessionLogReviewBlocks session={preparedSession} sets={sets} lang={lang} />
          </div>
        ) : (
          <div className="mx-4 mt-4 rounded-[20px] border border-border-app bg-layer-5 p-4 text-sm text-fg-muted">
            {lang === 'fr'
              ? 'Le détail de la structure n’est pas disponible pour cette séance (ancien format). Les métriques ci-dessus restent consultables.'
              : 'Session structure detail is unavailable for this log (legacy format). Metrics above remain available.'}
          </div>
        )}

        <div className="px-4 mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 h-11 rounded-full border border-border-app text-sm font-bold text-fg rf-focus-ring"
          >
            {lang === 'fr' ? 'Retour' : 'Back'}
          </button>
          <Link
            to="/history"
            className="flex-1 h-11 flex items-center justify-center rounded-full bg-brand text-on-brand text-sm font-bold rf-focus-ring"
          >
            {tr('history_page_title', lang)}
          </Link>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
