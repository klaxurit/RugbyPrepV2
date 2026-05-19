import type { Block, Exercise } from '../../../types/motherSession'
import { Icon } from '../../ui'
import { BlockHeader } from '../BlockHeader'
import type { BlockState } from '../BlockStateChip'
import {
  localizeMotherSessionExerciseName,
  type Lang,
} from '../../../services/motherSession/localizeMotherSessionExerciseName'
import { localizeBlockName } from '../../../services/motherSession/motherSessionBlockLabels'
import { hasExerciseDemo } from '../../../data/exercises'
import { resolveExerciseIdForSessionRun } from '../../../services/motherSession/motherSessionExerciseMap'
import { tr } from '../../../i18n/appLabels'

function warmupExerciseHasDemo(exo: Pick<Exercise, 'name' | 'exerciseId'>): boolean {
  const exoId = resolveExerciseIdForSessionRun(exo.name ?? '', exo.exerciseId)
  return Boolean(exoId && hasExerciseDemo(exoId))
}

interface WarmupBlockProps {
  block: Block
  /** Numéro affiché (eyebrow + ghost). 0 par convention pour l'échauffement. */
  number: number
  state: BlockState
  expanded: boolean
  onToggle: () => void
  lang?: Lang
  /** Ouvre la fiche vidéo (même résolution catalogue que ToursBlock). */
  onPlayDemo?: (exerciseIndex: number) => void
  /** Si faux, masque la pastille d'état (échauffement global hors suivi série par série). */
  showStateChip?: boolean
}

/**
 * Bloc échauffement — header standard + items numérotés 01..N quand déplié.
 * Pas de validation set-par-set : juste une checklist visuelle d'exos.
 */
export function WarmupBlock({
  block,
  number,
  state,
  expanded,
  onToggle,
  lang = 'fr',
  onPlayDemo,
  showStateChip = true,
}: WarmupBlockProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <BlockHeader
        number={number}
        icon="flame"
        title={localizeBlockName(block.name, lang)}
        state={state}
        expanded={expanded}
        onToggle={onToggle}
        lang={lang}
        showStateChip={showStateChip}
      />
      {expanded && block.exercises.length > 0 && (
        <ul className="flex flex-col gap-2 px-1">
          {block.exercises.map((exo, i) => (
            <WarmupItem
              key={i}
              number={i + 1}
              exo={exo}
              lang={lang}
              onPlayDemo={
                onPlayDemo && warmupExerciseHasDemo(exo) ? () => onPlayDemo(i) : undefined
              }
            />
          ))}
        </ul>
      )}
    </div>
  )
}

interface WarmupItemProps {
  number: number
  exo: Exercise
  lang: Lang
  onPlayDemo?: () => void
}

function WarmupItem({ number, exo, lang, onPlayDemo }: WarmupItemProps) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-paper-deep bg-app px-3.5 py-2.5">
      <span
        className="min-w-[22px] text-[11px] font-extrabold tabular-nums text-brand"
        aria-hidden
      >
        {String(number).padStart(2, '0')}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold leading-snug text-fg">
          {localizeMotherSessionExerciseName(exo.name, lang)}
        </div>
        {exo.prescription ? (
          <div className="mt-0.5 text-[11px] tabular-nums leading-snug text-fg/55">
            {exo.prescription}
          </div>
        ) : null}
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
    </li>
  )
}
