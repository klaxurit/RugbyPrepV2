import type { Block, Exercise } from '../../../types/motherSession'
import { BlockHeader } from '../BlockHeader'
import type { BlockState } from '../BlockStateChip'
import {
  localizeMotherSessionExerciseName,
  type Lang,
} from '../../../services/motherSession/localizeMotherSessionExerciseName'

interface WarmupBlockProps {
  block: Block
  /** Numéro affiché (eyebrow + ghost). 0 par convention pour l'échauffement. */
  number: number
  state: BlockState
  expanded: boolean
  onToggle: () => void
  lang?: Lang
}

/**
 * Bloc échauffement — header standard + items numérotés 01..N quand déplié.
 * Pas de validation set-par-set : juste une checklist visuelle d'exos.
 */
export function WarmupBlock({ block, number, state, expanded, onToggle, lang = 'fr' }: WarmupBlockProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <BlockHeader
        number={number}
        icon="flame"
        title={block.name}
        state={state}
        expanded={expanded}
        onToggle={onToggle}
        lang={lang}
      />
      {expanded && block.exercises.length > 0 && (
        <ul className="flex flex-col gap-2 px-1">
          {block.exercises.map((exo, i) => (
            <WarmupItem key={i} number={i + 1} exo={exo} lang={lang} />
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
}

function WarmupItem({ number, exo, lang }: WarmupItemProps) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-paper-deep bg-app px-3.5 py-2.5">
      <span
        className="min-w-[22px] text-[11px] font-extrabold tabular-nums text-brand"
        aria-hidden
      >
        {String(number).padStart(2, '0')}
      </span>
      <span className="flex-1 text-[13px] font-semibold text-fg">
        {localizeMotherSessionExerciseName(exo.name, lang)}
      </span>
      <span className="text-[11px] tabular-nums text-fg/55">{exo.prescription}</span>
    </li>
  )
}
