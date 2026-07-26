import type { Block, Exercise } from '../../../types/motherSession'
import type { Equipment } from '../../../types/training'
import { RefreshCw } from 'lucide-react'
import { Icon } from '../../ui'
import { BlockHeader } from '../BlockHeader'
import type { BlockState } from '../BlockStateChip'
import { SessionNotes } from '../SessionNotes'
import { BlockAlternativesPanel } from '../BlockAlternativesPanel'
import type { VariantPhaseContext } from '../../../services/equipment/exerciseVariantOptions'
import { tr, type Lang } from '../../../i18n/appLabels'
import { localizeBlockName } from '../../../services/motherSession/motherSessionBlockLabels'
import { localizeMotherSessionExerciseName } from '../../../services/motherSession/localizeMotherSessionExerciseName'
import { resolveExerciseIdForSessionRun } from '../../../services/motherSession/motherSessionExerciseMap'
import { hasExerciseDemo } from '../../../data/exercises'

function emomExerciseHasDemo(exo: Pick<Exercise, 'name' | 'exerciseId'>): boolean {
  const exoId = resolveExerciseIdForSessionRun(exo.name ?? '', exo.exerciseId)
  return Boolean(exoId && hasExerciseDemo(exoId))
}

interface EmomBlockProps {
  block: Block
  number: number
  state: BlockState
  expanded: boolean
  onToggle: () => void
  /** Total minutes du chrono (calculé via parseBlockFormat). */
  totalMinutes: number
  /** Vrai quand le timer overlay est actif (la page Phase C bascule en phase 'emom-timer'). */
  timerActive: boolean
  onStartTimer: () => void
  notes?: readonly string[]
  /** Alternatives matériel (med ball → câble, etc.). */
  fallbackOptions?: readonly string[]
  preparedExercises?: readonly Exercise[]
  equipment?: Equipment[]
  variantPhaseContext?: VariantPhaseContext
  lang?: Lang
  /** Fiche vidéo démo (même résolution que WarmupBlock / ToursBlock). */
  onPlayDemo?: (exerciseIndex: number) => void
  onOpenVariants?: (exerciseIndex: number) => void
  hasVariants?: (exerciseIndex: number) => boolean
  onSelectVariant?: (exerciseIndex: number, exerciseId: string) => void
}

/**
 * Bloc EMOM — header standard + carte chronométrée avec pattern minutes
 * (résolu depuis les `slotLabel` des exos quand fournis, sinon liste simple)
 * + bouton "Démarrer le chrono" en phase active.
 */
export function EmomBlock({
  block,
  number,
  state,
  expanded,
  onToggle,
  totalMinutes,
  timerActive,
  onStartTimer,
  notes,
  fallbackOptions,
  preparedExercises,
  equipment,
  variantPhaseContext,
  lang = 'fr',
  onPlayDemo,
  onOpenVariants,
  hasVariants,
  onSelectVariant,
}: EmomBlockProps) {
  const pattern = buildEmomPattern(block.exercises)

  return (
    <div className="flex flex-col gap-2.5">
      <BlockHeader
        number={number}
        icon="circle"
        title={localizeBlockName(block.name, lang)}
        state={state}
        expanded={expanded}
        onToggle={onToggle}
        lang={lang}
      />

      {expanded && (
        <div className="flex flex-col gap-3 px-1">
          <div className="rounded-[14px] border-[1.5px] border-brand/35 bg-app px-4 py-3.5">
            <div className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-brand">
              <Icon name="circle" size={10} color="var(--color-accent)" strokeWidth={2} />
              {tr('emom_chrono_block', lang)}
            </div>
            <p className="mb-3 text-[12px] leading-[1.5] text-fg-secondary">
              {totalMinutes} {tr('emom_minutes_intro_pre', lang)}
            </p>
            <ul className="mb-3.5 flex flex-col gap-2">
              {pattern.map((p) => (
                <li key={p.exerciseIndex} className="flex items-start gap-2.5">
                  <span className="min-w-[88px] text-[12px] font-extrabold tabular-nums text-brand">
                    {p.label}
                  </span>
                  <span
                    aria-hidden
                    className="mt-2 h-[3px] w-[3px] flex-shrink-0 rounded-full bg-brand opacity-50"
                  />
                  <span className="min-w-0 flex-1 text-[13px] text-fg">
                    <strong>{localizeMotherSessionExerciseName(p.exercise.name, lang)}</strong>
                    {p.detail && (
                      <span className="ml-1 font-medium text-fg-muted">{p.detail}</span>
                    )}
                  </span>
                  {onOpenVariants && hasVariants?.(p.exerciseIndex) ? (
                    <button
                      type="button"
                      onClick={() => onOpenVariants(p.exerciseIndex)}
                      aria-label={tr('exercise_aria_variants', lang)}
                      data-testid="exercise-variants-btn"
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-paper-deep bg-app rf-focus-ring"
                    >
                      <RefreshCw size={14} color="var(--color-text-primary)" strokeWidth={1.8} aria-hidden />
                    </button>
                  ) : null}
                  {onPlayDemo && emomExerciseHasDemo(p.exercise) ? (
                    <button
                      type="button"
                      onClick={() => onPlayDemo(p.exerciseIndex)}
                      aria-label={tr('exercise_aria_demo', lang)}
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-paper-deep bg-app rf-focus-ring"
                    >
                      <Icon name="eye" size={14} color="var(--color-text-primary)" strokeWidth={1.6} />
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>

            {state === 'active' && !timerActive && (
              <button
                type="button"
                onClick={onStartTimer}
                className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-brand text-app text-[13px] font-extrabold uppercase tracking-[0.06em] active:scale-[0.98] transition-transform rf-focus-ring"
                style={{ boxShadow: '0 8px 20px rgba(123, 13, 30, 0.4)' }}
              >
                <Icon name="play" size={12} strokeWidth={2.4} />
                {tr('emom_start_chrono', lang)}
              </button>
            )}

            {state === 'active' && timerActive && (
              <div
                className="flex w-full items-center gap-2.5 rounded-xl border-[1.5px] border-dashed border-brand/55 bg-badge-wine px-4 py-3.5 animate-rf-pulse"
                style={{ animationDuration: '1.5s' }}
              >
                <span aria-hidden className="h-2 w-2 rounded-full bg-brand" />
                <span className="flex-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-brand">
                  {tr('emom_chrono_active', lang)}
                </span>
              </div>
            )}

            {state === 'done' && (
              <div className="flex w-full items-center gap-2.5 rounded-xl bg-win-soft text-win px-4 py-3">
                <Icon name="check" size={16} color="var(--color-milestone-green)" strokeWidth={2.6} />
                <span className="text-[11px] font-extrabold uppercase tracking-[0.1em]">
                  {tr('emom_block_done', lang)}
                </span>
              </div>
            )}
          </div>

          {notes && notes.length > 0 && (
            <SessionNotes
              notes={notes}
              defaultOpen={state === 'active'}
              label={tr('session_coaching_notes', lang)}
            />
          )}
          <BlockAlternativesPanel
            preparedExercises={preparedExercises ?? block.exercises}
            displayExercises={block.exercises}
            fallbackOptions={fallbackOptions}
            lang={lang}
            equipment={equipment}
            phaseContext={variantPhaseContext}
            defaultOpen={state === 'active'}
            onOpenVariants={onOpenVariants}
            onSelectVariant={onSelectVariant}
          />
        </div>
      )}
    </div>
  )
}

interface EmomPatternEntry {
  label: string
  exerciseIndex: number
  exercise: Exercise
  detail?: string
}

/**
 * Construit le pattern minute-par-minute affiché. Si les exercices ont un
 * `slotLabel` (ex: "Min 1, 3, 5, 7"), on l'utilise. Sinon, fallback minimal :
 * "Min 1, 2, …" mappé séquentiellement.
 */
function buildEmomPattern(exercises: readonly Exercise[]): EmomPatternEntry[] {
  if (exercises.length === 0) return []
  const hasSlots = exercises.some((e) => e.slotLabel)
  if (hasSlots) {
    return exercises
      .map((e, exerciseIndex): EmomPatternEntry | null =>
        e.slotLabel
          ? {
              label: e.slotLabel,
              exerciseIndex,
              exercise: e,
              detail: e.prescription,
            }
          : null,
      )
      .filter((x): x is EmomPatternEntry => x !== null)
  }
  return exercises.map((e, i) => ({
    label: `Min ${i + 1}`,
    exerciseIndex: i,
    exercise: e,
    detail: e.prescription,
  }))
}
