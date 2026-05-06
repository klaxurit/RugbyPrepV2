import type { Block, Exercise } from '../../../types/motherSession'
import { Icon } from '../../ui'
import { parseExerciseSetSpec } from '../../../services/ui/exerciseSetSpec'
import { BlockHeader } from '../BlockHeader'
import type { BlockState } from '../BlockStateChip'
import { SessionNotes } from '../SessionNotes'

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
  onStartIso?: (exoIdx: number, durationSec: number) => void
  notes?: readonly string[]
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
  notes,
}: PrehabBlockProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <BlockHeader
        number={number}
        icon="sparkle"
        title={block.name}
        state={state}
        expanded={expanded}
        onToggle={onToggle}
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
              onStartIso={onStartIso ? (sec) => onStartIso(i, sec) : undefined}
            />
          ))}

          {notes && notes.length > 0 && <SessionNotes notes={notes} defaultOpen={false} />}
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
  onStartIso?: (durationSec: number) => void
}

function PrehabRow({ exo, isCurrent, validated, onValidate, onStartIso }: PrehabRowProps) {
  // Détecte une prescription temps (ex: "2x15-20s/side") → propose un bouton iso.
  const spec = parseExerciseSetSpec(exo.prescription)
  const isoSeconds = spec.kind === 'time' ? spec.durationLow : null

  const wrapperClass = isCurrent
    ? 'bg-badge-wine border-[1.5px] border-brand/55'
    : 'bg-app border border-paper-deep'

  return (
    <div className={`flex items-center gap-2.5 rounded-xl px-3.5 py-3 ${wrapperClass}`}>
      <button
        type="button"
        onClick={onValidate}
        aria-label={validated ? 'Marquer non fait' : 'Valider'}
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
          {exo.name}
        </div>
        <div className="mt-0.5 text-[11px] tabular-nums text-fg-muted">{exo.prescription}</div>
      </div>

      {isoSeconds != null && isCurrent && !validated && onStartIso && (
        <button
          type="button"
          onClick={() => onStartIso(isoSeconds)}
          className="inline-flex h-8 items-center gap-1.5 rounded-[10px] bg-brand text-app px-3 text-[11px] font-extrabold uppercase tracking-[0.06em] active:scale-[0.97] transition-transform rf-focus-ring"
        >
          <Icon name="play" size={9} strokeWidth={2.4} />
          {isoSeconds}s
        </button>
      )}
    </div>
  )
}
