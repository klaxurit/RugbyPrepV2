export type BlockState = 'pending' | 'active' | 'done'

interface BlockStateChipProps {
  state: BlockState
}

const LABELS: Record<BlockState, string> = {
  pending: 'À venir',
  active: 'En cours',
  done: 'Terminé',
}

const DOTS: Record<BlockState, string> = {
  pending: '○',
  active: '●',
  done: '✓',
}

/**
 * Pastille d'état d'un bloc — pattern bordeaux/vert/cream du design v4-pro.
 * Active : remplie bordeaux ; Done : remplie vert ; Pending : outline cream.
 */
export function BlockStateChip({ state }: BlockStateChipProps) {
  const tone =
    state === 'active'
      ? 'bg-brand text-app'
      : state === 'done'
        ? 'bg-win text-app'
        : 'border border-paper-deep text-fg'

  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.14em] ${tone}`}
    >
      <span aria-hidden>{DOTS[state]}</span>
      {LABELS[state]}
    </span>
  )
}
