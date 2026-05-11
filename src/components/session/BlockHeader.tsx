import { Icon, type IconName } from '../ui'
import { BlockStateChip, type BlockState } from './BlockStateChip'
import { tr, type Lang } from '../../i18n/appLabels'

interface BlockHeaderProps {
  /** Numéro affiché en eyebrow + ghost (ex: 02). */
  number: number
  /** Icône du bloc (typée Icon). */
  icon: IconName
  title: string
  /** Durée en minutes affichée à côté du chip d'état. */
  durationMin?: number
  state: BlockState
  expanded: boolean
  onToggle: () => void
  lang?: Lang
}

const STATE_BG: Record<BlockState, string> = {
  pending: 'bg-app',
  active: 'bg-app',
  done: 'bg-paper-soft',
}

const STATE_BORDER: Record<BlockState, string> = {
  pending: 'border-paper-deep',
  active: 'border-brand/55',
  done: 'border-win/40',
}

const ICON_PILL_BG: Record<BlockState, string> = {
  pending: 'bg-paper-deep text-brand',
  active: 'bg-brand text-app',
  done: 'bg-win-soft text-win',
}

/**
 * Header d'un bloc dans la page Séance — column layout (icon top-left,
 * eyebrow + chevron top-right, title pleine largeur sur plusieurs lignes,
 * meta state + durée en bas). Ghost number 180px italique en arrière-plan.
 *
 * Le titre n'est jamais tronqué — `text-wrap: pretty` permet de couper
 * proprement les libellés longs ("Soulevé de terre jambes tendues barre (RDL)").
 */
export function BlockHeader({
  number,
  icon,
  title,
  durationMin,
  state,
  expanded,
  onToggle,
  lang = 'fr',
}: BlockHeaderProps) {
  const numStr = String(number).padStart(2, '0')
  const isDone = state === 'done'

  return (
    <div
      className={`relative overflow-hidden rounded-[22px] border-[1.5px] ${STATE_BG[state]} ${STATE_BORDER[state]} animate-rf-slide-up`}
    >
      {/* Ghost number décoratif en arrière-plan */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-4 -top-9 select-none font-serif italic font-extrabold leading-none tabular-nums"
        style={{
          fontSize: 180,
          letterSpacing: -8,
          color:
            state === 'active'
              ? 'rgb(123 13 30 / 0.07)'
              : state === 'done'
                ? 'rgb(63 107 74 / 0.08)'
                : 'rgb(44 24 16 / 0.05)',
        }}
      >
        {numStr}
      </div>

      <div className="relative px-[18px] pb-3.5 pt-[18px]">
        {/* Top row : icône (gauche) · eyebrow + chevron (droite) */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div
            className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${ICON_PILL_BG[state]}`}
          >
            {isDone ? (
              <Icon name="check" size={22} color="var(--color-milestone-green)" strokeWidth={2.6} />
            ) : (
              <Icon name={icon} size={20} strokeWidth={2} />
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <span
              className={`text-[9px] font-extrabold uppercase tracking-[0.16em] text-brand ${
                state === 'pending' ? 'opacity-60' : ''
              }`}
            >
              {tr('block_eyebrow', lang)} {numStr}
            </span>
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={expanded}
              aria-label={tr(expanded ? 'block_collapse' : 'block_expand', lang)}
              className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full border border-paper-deep bg-app transition-transform rf-focus-ring"
              style={{ transform: expanded ? 'rotate(180deg)' : undefined }}
            >
              <Icon name="chevron-down" size={14} color="var(--color-text-primary)" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Title pleine largeur — text-wrap pretty pour libellés longs */}
        <h2
          className="font-serif italic font-extrabold leading-[1.05] text-fg [text-wrap:pretty]"
          style={{
            fontSize: 22,
            letterSpacing: '-0.6px',
            textDecoration: isDone ? 'line-through' : 'none',
            textDecorationColor: 'rgb(63 107 74 / 0.55)',
            opacity: isDone ? 0.65 : 1,
          }}
        >
          {title}
        </h2>

        {/* Meta : chip d'état + durée */}
        <div className="mt-3 flex flex-wrap items-center gap-2 gap-y-1.5">
          <BlockStateChip state={state} lang={lang} />
          {durationMin != null && (
            <span className="text-[10px] font-bold tabular-nums tracking-wide text-fg/55">
              {durationMin} MIN
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
