import { useMemo } from 'react'
import type { MotherSession } from '../../types/motherSession'
import type { ExerciseSetLog } from '../../types/training'
import { localizeBlockName } from '../../services/motherSession/motherSessionBlockLabels'
import {
  isDirectiveText,
  resolveExerciseIdForSessionRun,
} from '../../services/motherSession/motherSessionExerciseMap'
import { localizeMotherSessionExerciseName } from '../../services/motherSession/localizeMotherSessionExerciseName'
import { getExerciseName } from '../../data/exercises'
import { SessionNotes } from './SessionNotes'
import type { Lang } from '../../services/motherSession/localizeMotherSessionExerciseName'

interface SessionLogReviewBlocksProps {
  session: MotherSession
  sets: readonly ExerciseSetLog[]
  lang: Lang
}

function formatSetLine(set: ExerciseSetLog): string {
  if (set.loadKg != null && set.reps != null) return `${set.loadKg} kg × ${set.reps}`
  if (set.seconds != null) return `${set.seconds}s`
  if (set.meters != null) return `${set.meters} m`
  if (set.loadKg != null) return `${set.loadKg} kg`
  if (set.reps != null) return `${set.reps} reps`
  return '—'
}

function exerciseLabel(
  name: string,
  exerciseId: string | undefined,
  lang: Lang,
): string {
  if (isDirectiveText(name)) return name
  const id = resolveExerciseIdForSessionRun(name, exerciseId)
  if (id) return getExerciseName(id, lang) ?? localizeMotherSessionExerciseName(name, lang)
  return localizeMotherSessionExerciseName(name, lang)
}

/**
 * Affichage lecture seule d'une séance terminée : blocs, exos et charges loguées.
 */
export function SessionLogReviewBlocks({ session, sets, lang }: SessionLogReviewBlocksProps) {
  const setsByBlockExTour = useMemo(() => {
    const map = new Map<string, ExerciseSetLog>()
    for (const s of sets) {
      map.set(`${s.blockNumber}__${s.exerciseId}__${s.tourIndex}`, s)
    }
    return map
  }, [sets])

  const warmup = session.warmUp
  const hasWarmup = warmup && warmup.exercises.length > 0

  return (
    <div className="space-y-3">
      {hasWarmup && (
        <section className="rounded-[20px] border border-border-app bg-layer-5 p-4">
          <h3 className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-fg-muted">
            {lang === 'fr' ? 'Échauffement' : 'Warm-up'}
          </h3>
          <ul className="mt-3 space-y-2">
            {warmup.exercises.map((exo, i) => (
              <li key={i} className="text-sm text-fg">
                <span className="font-bold">{exerciseLabel(exo.name, undefined, lang)}</span>
                {exo.prescription ? (
                  <span className="text-fg-muted"> · {exo.prescription}</span>
                ) : null}
              </li>
            ))}
          </ul>
          {warmup.notes.length > 0 && (
            <div className="mt-3">
              <SessionNotes notes={warmup.notes} defaultOpen={false} />
            </div>
          )}
        </section>
      )}

      {session.blocks.map((block) => {
        return (
          <section
            key={block.number}
            className="rounded-[20px] border border-border-app bg-layer-5 overflow-hidden"
          >
            <div className="border-b border-border-app px-4 py-3">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-brand">
                {lang === 'fr' ? `Bloc ${block.number}` : `Block ${block.number}`}
              </div>
              <h3 className="mt-0.5 text-base font-bold text-fg">
                {localizeBlockName(block.name, lang)}
              </h3>
              {block.format ? (
                <p className="mt-1 text-xs text-fg-muted">{block.format}</p>
              ) : null}
            </div>

            <div className="divide-y divide-border-app">
              {block.exercises.map((exo, exerciseIndex) => {
                if (!exo || isDirectiveText(exo.name)) {
                  return (
                    <div key={exerciseIndex} className="px-4 py-3 text-sm italic text-fg-muted">
                      {exo?.name}
                    </div>
                  )
                }
                const id = resolveExerciseIdForSessionRun(exo.name, exo.exerciseId)
                const label = exerciseLabel(exo.name, exo.exerciseId, lang)
                const tours: ExerciseSetLog[] = []
                if (id) {
                  for (let tour = 0; tour < 8; tour++) {
                    const set = setsByBlockExTour.get(`${block.number}__${id}__${tour}`)
                    if (set) tours.push(set)
                  }
                }

                return (
                  <div key={exerciseIndex} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-fg">{label}</div>
                        {exo.prescription ? (
                          <div className="text-xs text-fg-muted mt-0.5">{exo.prescription}</div>
                        ) : null}
                      </div>
                    </div>
                    {tours.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {tours.map((set) => (
                          <li
                            key={set.id}
                            className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-bold text-brand"
                          >
                            T{set.tourIndex + 1} · {formatSetLine(set)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>

            {block.coachingNotes.length > 0 && (
              <div className="border-t border-border-app p-3">
                <SessionNotes notes={block.coachingNotes} defaultOpen={false} label="Notes de coaching" />
              </div>
            )}
            {block.fallbackOptions && block.fallbackOptions.length > 0 && (
              <div className="border-t border-border-app p-3">
                <SessionNotes notes={block.fallbackOptions} defaultOpen={false} label="Alternatives" />
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
