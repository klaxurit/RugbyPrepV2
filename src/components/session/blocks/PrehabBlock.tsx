import type { Block, Exercise } from '../../../types/motherSession'
import { Icon } from '../../ui'
import { parseExerciseSetSpec } from '../../../services/ui/exerciseSetSpec'
import { BlockHeader } from '../BlockHeader'
import type { BlockState } from '../BlockStateChip'
import { SessionNotes } from '../SessionNotes'
import {
  localizeMotherSessionExerciseName,
  type Lang,
} from '../../../services/motherSession/localizeMotherSessionExerciseName'
import { localizeBlockName } from '../../../services/motherSession/motherSessionBlockLabels'
import { tr } from '../../../i18n/appLabels'
import { resolveExerciseIdForSessionRun } from '../../../services/motherSession/motherSessionExerciseMap'
import { hasExerciseDemo } from '../../../data/exercises'

function prehabExerciseHasDemo(exo: Pick<Exercise, 'name' | 'exerciseId'>): boolean {
  const exoId = resolveExerciseIdForSessionRun(exo.name ?? '', exo.exerciseId)
  return Boolean(exoId && hasExerciseDemo(exoId))
}

interface PrehabBlockProps {
  block: Block
  number: number
  state: BlockState
  expanded: boolean
  onToggle: () => void
  /** Index courant dans les exos (0-based) — highlight + bouton iso actif. */
  currentExoIdx?: number
  /** Map exoIdx → validated. */
  validatedByIdx?: Record<number, boolean>
  onValidateExo: (exoIdx: number) => void
  /** Lance le mini-chrono iso (ouvre l'overlay côté page). Passé à chaque exo iso. */
  onStartIso?: (exoIdx: number) => void
  /** Fiche vidéo démo quand disponible dans le catalogue. */
  onPlayDemo?: (exoIdx: number) => void
  notes?: readonly string[]
  /** Alternatives matériel (med ball → câble, etc.). */
  fallbackOptions?: readonly string[]
  lang?: Lang
}

/**
 * Bloc Préhab — exos courts type mobilité/stabilité avec mini-chrono iso intégré.
 * Si l'exo a une prescription `time` (ex: "2x15s/side"), on affiche un bouton iso
 * "15s" qui déclenche l'overlay côté page. Sinon, simple checkbox de validation.
 */
export function PrehabBlock({
  block,
  number,
  state,
  expanded,
  onToggle,
  currentExoIdx = 0,
  validatedByIdx,
  onValidateExo,
  onStartIso,
  onPlayDemo,
  notes,
  fallbackOptions,
  lang = 'fr',
}: PrehabBlockProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <BlockHeader
        number={number}
        icon="sparkle"
        title={localizeBlockName(block.name, lang)}
        state={state}
        expanded={expanded}
        onToggle={onToggle}
        lang={lang}
      />

      {expanded && (
        <div className="flex flex-col gap-2 px-1">
          {block.exercises.map((exo, i) => (
            <PrehabRow
              key={i}
              exo={exo}
              isCurrent={state === 'active' && i === currentExoIdx}
              validated={validatedByIdx?.[i] ?? false}
              onValidate={() => onValidateExo(i)}
              onStartIso={onStartIso ? () => onStartIso(i) : undefined}
              onPlayDemo={
                onPlayDemo && prehabExerciseHasDemo(exo) ? () => onPlayDemo(i) : undefined
              }
              lang={lang}
            />
          ))}

          {notes && notes.length > 0 && (
            <SessionNotes
              notes={notes}
              defaultOpen={false}
              label={tr('session_coaching_notes', lang)}
            />
          )}
          {fallbackOptions && fallbackOptions.length > 0 && (
            <SessionNotes
              notes={fallbackOptions}
              defaultOpen={false}
              label={tr('session_alternatives', lang)}
            />
          )}
        </div>
      )}
    </div>
  )
}

interface PrehabRowProps {
  exo: Exercise
  isCurrent: boolean
  validated: boolean
  onValidate: () => void
  onStartIso?: () => void
  onPlayDemo?: () => void
  lang: Lang
}

function PrehabRow({
  exo,
  isCurrent,
  validated,
  onValidate,
  onStartIso,
  onPlayDemo,
  lang,
}: PrehabRowProps) {
  // Détecte une prescription temps (ex: "2x15-20s/side") → propose un bouton iso.
  const spec = parseExerciseSetSpec(exo.prescription)
  const isoLabel =
    spec.kind === 'time'
      ? spec.durationHigh > spec.durationLow
        ? `${spec.durationLow}-${spec.durationHigh}s`
        : spec.perSide
          ? `${spec.durationLow}s/côté`
          : `${spec.durationLow}s`
      : null

  const wrapperClass = isCurrent
    ? 'bg-badge-wine border-[1.5px] border-brand/55'
    : 'bg-app border border-paper-deep'

  return (
    <div className={`flex items-center gap-2.5 rounded-xl px-3.5 py-3 ${wrapperClass}`}>
      <button
        type="button"
        onClick={onValidate}
        aria-label={validated ? tr('exercise_aria_unvalidate', lang) : tr('exercise_aria_validate', lang)}
        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full rf-focus-ring transition-colors ${
          validated
            ? 'bg-win'
            : `border-[1.5px] bg-transparent ${isCurrent ? 'border-brand' : 'border-fg/40'}`
        }`}
      >
        {validated && <Icon name="check" size={14} color="var(--color-bg-app)" strokeWidth={3} />}
      </button>

      <div className="min-w-0 flex-1">
        <div
          className="text-[13px] font-bold text-fg"
          style={{
            textDecoration: validated ? 'line-through' : 'none',
            opacity: validated ? 0.55 : 1,
          }}
        >
          {localizeMotherSessionExerciseName(exo.name, lang)}
        </div>
        <div className="mt-0.5 text-[11px] tabular-nums text-fg-muted">{exo.prescription}</div>
      </div>

      {onPlayDemo && (
        <button
          type="button"
          onClick={onPlayDemo}
          aria-label={tr('exercise_aria_demo', lang)}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-paper-deep bg-app rf-focus-ring"
        >
          <Icon name="eye" size={14} color="var(--color-text-primary)" strokeWidth={1.6} />
        </button>
      )}

      {isoLabel != null && isCurrent && !validated && onStartIso && (
        <button
          type="button"
          onClick={onStartIso}
          className="inline-flex h-8 items-center gap-1.5 rounded-[10px] bg-brand text-app px-3 text-[11px] font-extrabold uppercase tracking-[0.06em] active:scale-[0.97] transition-transform rf-focus-ring"
        >
          <Icon name="play" size={9} strokeWidth={2.4} />
          {isoLabel}
        </button>
      )}
    </div>
  )
}
