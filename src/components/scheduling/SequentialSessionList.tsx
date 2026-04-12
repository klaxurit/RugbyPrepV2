import { useState } from 'react'
import { Layers, Play, SkipForward } from 'lucide-react'
import type { BlockProgressionState, SequentialSession } from '../../types/scheduling'
import { formatTitleFromMotherSessionId } from '../motherSession/formatMotherSessionTitle'
import type { AppLang } from '../../services/motherSession/motherSessionLabels'

const SESSION_TYPE_LABELS: Record<string, Record<AppLang, string>> = {
  upper: { fr: 'Haut du corps', en: 'Upper Body' },
  lower: { fr: 'Bas du corps', en: 'Lower Body' },
  full: { fr: 'Corps complet', en: 'Full Body' },
  full_light_primer: { fr: 'Activation', en: 'Primer' },
  speed_power: { fr: 'Vitesse-Puissance', en: 'Speed-Power' },
}

function getSessionTypeLabel(type: string, lang: AppLang): string {
  return SESSION_TYPE_LABELS[type]?.[lang] ?? ''
}

interface SequentialSessionListProps {
  sessions: SequentialSession[]
  blockProgression?: BlockProgressionState
  lang?: AppLang
  onSessionSelect?: (index: number) => void
  onSkipSession?: (sessionId: string) => void
}

export function SequentialSessionList({
  sessions,
  blockProgression,
  lang = 'fr',
  onSessionSelect,
  onSkipSession,
}: SequentialSessionListProps) {
  const [skipConfirmId, setSkipConfirmId] = useState<string | null>(null)
  const blockLabel = blockProgression?.currentBlockLabel ?? ''
  const completed = blockProgression?.sessionsCompletedInBlock ?? 0
  const totalInBlock = blockProgression?.totalSessionsInBlock ?? 0

  return (
    <section className="space-y-5" data-testid="sequential-session-list">
      {/* Progress header */}
      {blockLabel && (
        <div className="space-y-2" data-testid="sequential-progress">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-fg">{blockLabel}</h3>
            {totalInBlock > 0 && (
              <span className="text-[10px] font-bold text-fg-muted">
                {completed}/{totalInBlock} {lang === 'fr' ? 'séances' : 'sessions'}
              </span>
            )}
          </div>
          {totalInBlock > 0 && (
            <div className="h-1.5 bg-layer-10 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all duration-500"
                style={{ width: `${Math.min((completed / totalInBlock) * 100, 100)}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Session cards */}
      <div className="flex items-center gap-2 mt-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-medium text-brand-tint">
          <Layers className="h-4 w-4" aria-hidden />
        </div>
        <h3 className="text-sm font-black text-fg">
          {lang === 'fr' ? 'Tes séances' : 'Your sessions'}
        </h3>
      </div>

      {sessions.length > 0 && (
        <div className="space-y-2" data-testid="sequential-session-cards">
          {sessions.map((seq, i) => {
            const slot = seq.sessionSlot
            const title = formatTitleFromMotherSessionId(slot.session.metadata.id, lang)
            const typeLabel = getSessionTypeLabel(slot.session.metadata.sessionType, lang)
            const blockCount = slot.session.blocks.length
            const isLight = slot.variant === 'light'
            const isSkipped = seq.completionStatus === 'skipped'

            return (
              <div
                key={`${slot.sessionId}-${i}`}
                data-testid={`sequential-session-card-${i}`}
                className={`w-full flex items-center gap-4 border rounded-[2rem] p-4 transition-all text-left ${
                  isSkipped
                    ? 'bg-layer-2 border-edge-hairline opacity-50'
                    : 'bg-ok-bg border-ok-bd hover:shadow-sm group'
                }`}
              >
                {/* Sequence badge */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex flex-col items-center justify-center ${isSkipped ? 'bg-layer-5' : 'bg-ok-bg-muted'}`}>
                  <span className={`text-lg font-black ${isSkipped ? 'text-fg-faint line-through' : 'text-ok-strong'}`}>{seq.sequenceIndex}</span>
                  <span className={`text-[7px] font-bold uppercase -mt-0.5 ${isSkipped ? 'text-fg-ghost' : 'text-ok'}`}>
                    /{seq.totalInWeek}
                  </span>
                </div>

                {/* Content */}
                <button
                  type="button"
                  onClick={() => !isSkipped && onSessionSelect?.(i)}
                  className="flex-1 min-w-0 text-left"
                  disabled={isSkipped}
                >
                  <h4 className={`font-black text-sm truncate ${isSkipped ? 'text-fg-faint line-through' : 'text-fg'}`}>{title}</h4>
                  <p className="text-xs text-fg-muted mt-0.5">
                    {isSkipped
                      ? (lang === 'fr' ? 'Passée' : 'Skipped')
                      : <>
                          {typeLabel && `${typeLabel} · `}
                          {blockCount} {lang === 'fr' ? 'blocs' : 'blocks'}
                          {isLight ? ` · ${lang === 'fr' ? 'léger' : 'light'}` : ''}
                        </>
                    }
                  </p>
                </button>

                {/* Actions */}
                {isSkipped ? null : (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {onSkipSession && (
                      <button
                        type="button"
                        data-testid={`sequential-skip-${i}`}
                        onClick={(e) => { e.stopPropagation(); setSkipConfirmId(skipConfirmId === slot.sessionId ? null : slot.sessionId) }}
                        className="w-8 h-8 rounded-xl bg-layer-5 flex items-center justify-center text-fg-faint hover:text-fg-secondary hover:bg-layer-10 transition-colors"
                        title={lang === 'fr' ? 'Passer' : 'Skip'}
                      >
                        <SkipForward className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onSessionSelect?.(i)}
                      className="w-9 h-9 rounded-xl bg-brand-soft flex items-center justify-center group-hover:bg-brand-border transition-colors"
                    >
                      <Play className="w-4 h-4 text-brand-tint" />
                    </button>
                  </div>
                )}

                {/* F6: Inline skip confirmation */}
                {skipConfirmId === slot.sessionId && onSkipSession && (
                  <div className="flex items-center gap-2 pt-2 w-full" data-testid={`sequential-skip-confirm-${i}`}>
                    <span className="text-[9px] text-fg-muted flex-1">
                      Tu es sûr ? Cette séance ne sera pas rattrapée.
                    </span>
                    <button
                      type="button"
                      data-testid={`sequential-skip-confirm-yes-${i}`}
                      onClick={(e) => { e.stopPropagation(); onSkipSession(slot.sessionId); setSkipConfirmId(null) }}
                      className="px-2 py-1 rounded-lg text-[9px] font-bold bg-danger-bg-cta text-danger-soft hover:bg-danger-bg-hover transition-colors"
                    >
                      Confirmer
                    </button>
                    <button
                      type="button"
                      data-testid={`sequential-skip-confirm-no-${i}`}
                      onClick={(e) => { e.stopPropagation(); setSkipConfirmId(null) }}
                      className="px-2 py-1 rounded-lg text-[9px] font-bold bg-layer-10 text-fg-soft hover:bg-layer-15 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
