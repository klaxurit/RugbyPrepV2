import { useMemo } from 'react'
import { MOTHER_SESSIONS_BY_ID } from '../../data/motherSessions.generated'
import type { MonthPlannedSession } from '../../services/scheduling/resolveMonthProgramGrid'
import { prepareSessionForRender } from '../../services/session/prepareSessionForRender'
import type { Equipment, TrainingLevel } from '../../types/training'
import type { Lang } from '../../i18n/appLabels'
import { BottomSheet } from '../ui/BottomSheet'

export interface SessionMonthPreviewSheetProps {
  session: MonthPlannedSession | null
  onClose: () => void
  lang: Lang
  trainingLevel?: TrainingLevel
  equipment?: Equipment[]
}

function statusLabel(status: MonthPlannedSession['status'], lang: Lang): string {
  if (lang === 'fr') {
    if (status === 'completed') return 'Faite'
    if (status === 'missed') return 'Manquée'
    if (status === 'skipped') return 'Passée'
    return 'À faire'
  }
  if (status === 'completed') return 'Done'
  if (status === 'missed') return 'Missed'
  if (status === 'skipped') return 'Skipped'
  return 'Planned'
}

function formatPreviewDate(iso: string, lang: Lang): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

/**
 * Aperçu lecture seule d’une séance planifiée depuis la grille mois.
 * Pas de CTA — détail blocs + exercices uniquement.
 */
export function SessionMonthPreviewSheet({
  session,
  onClose,
  lang,
  trainingLevel,
  equipment,
}: SessionMonthPreviewSheetProps) {
  const open = session !== null

  const prepared = useMemo(() => {
    if (!session) return null
    const raw = MOTHER_SESSIONS_BY_ID[session.motherSessionId]
    if (!raw) return null
    return prepareSessionForRender({
      session: raw,
      trainingLevel,
      equipment,
      lang,
    })
  }, [session, trainingLevel, equipment, lang])

  const status = session?.status ?? 'pending'

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabel={session?.title ?? (lang === 'fr' ? 'Aperçu séance' : 'Session preview')}
      eyebrow={
        session
          ? `${session.shortLabel} · ${statusLabel(status, lang)}`
          : undefined
      }
      title={session?.title}
    >
      {session && (
        <div className="space-y-4 pb-2" data-testid="session-month-preview">
          <p className="text-[12px] font-semibold capitalize text-fg-muted">
            {formatPreviewDate(session.dateISO, lang)}
          </p>

          {!prepared ? (
            <p className="text-[13px] text-fg-muted">
              {lang === 'fr'
                ? 'Détail de séance indisponible.'
                : 'Session details unavailable.'}
            </p>
          ) : (
            <ul className="space-y-3">
              {prepared.blocks.map((block) => (
                <li
                  key={block.number}
                  className="rounded-2xl border border-border-app bg-layer-6 px-3.5 py-3"
                >
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-brand">
                    {lang === 'fr' ? `Bloc ${block.number}` : `Block ${block.number}`}
                    {block.name ? ` · ${block.name}` : ''}
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {block.exercises.map((ex, idx) => (
                      <li
                        key={`${block.number}-${idx}-${ex.name}`}
                        className="text-[13px] leading-snug text-fg"
                      >
                        <span className="font-semibold">{ex.name}</span>
                        {ex.prescription ? (
                          <span className="text-fg-muted"> — {ex.prescription}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </BottomSheet>
  )
}
