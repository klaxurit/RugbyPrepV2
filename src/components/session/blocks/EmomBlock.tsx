import type { Block, Exercise } from '../../../types/motherSession'
import { Icon } from '../../ui'
import { BlockHeader } from '../BlockHeader'
import type { BlockState } from '../BlockStateChip'
import { SessionNotes } from '../SessionNotes'
import type { Lang } from '../../../i18n/appLabels'

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
  lang?: Lang
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
  lang = 'fr',
}: EmomBlockProps) {
  const pattern = buildEmomPattern(block.exercises)

  return (
    <div className="flex flex-col gap-2.5">
      <BlockHeader
        number={number}
        icon="circle"
        title={block.name}
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
              Bloc chronométré · EMOM
            </div>
            <p className="mb-3 text-[12px] leading-[1.5] text-fg-secondary">
              {totalMinutes} minutes — une nouvelle minute = un nouvel exercice.
            </p>
            <ul className="mb-3.5 flex flex-col gap-2">
              {pattern.map((p, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="min-w-[88px] text-[12px] font-extrabold tabular-nums text-brand">
                    {p.label}
                  </span>
                  <span
                    aria-hidden
                    className="mt-2 h-[3px] w-[3px] flex-shrink-0 rounded-full bg-brand opacity-50"
                  />
                  <span className="flex-1 text-[13px] text-fg">
                    <strong>{p.exo}</strong>
                    {p.detail && <span className="ml-1 font-medium text-fg-muted">{p.detail}</span>}
                  </span>
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
                Démarrer le chrono
              </button>
            )}

            {state === 'active' && timerActive && (
              <div
                className="flex w-full items-center gap-2.5 rounded-xl border-[1.5px] border-dashed border-brand/55 bg-badge-wine px-4 py-3.5 animate-rf-pulse"
                style={{ animationDuration: '1.5s' }}
              >
                <span aria-hidden className="h-2 w-2 rounded-full bg-brand" />
                <span className="flex-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-brand">
                  Chrono actif — consulte l&apos;overlay
                </span>
              </div>
            )}

            {state === 'done' && (
              <div className="flex w-full items-center gap-2.5 rounded-xl bg-win-soft text-win px-4 py-3">
                <Icon name="check" size={16} color="var(--color-milestone-green)" strokeWidth={2.6} />
                <span className="text-[11px] font-extrabold uppercase tracking-[0.1em]">
                  Bloc terminé
                </span>
              </div>
            )}
          </div>

          {notes && notes.length > 0 && <SessionNotes notes={notes} defaultOpen={state === 'active'} />}
        </div>
      )}
    </div>
  )
}

interface EmomPatternEntry {
  label: string
  exo: string
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
      .filter((e) => e.slotLabel)
      .map((e) => ({
        label: e.slotLabel ?? '',
        exo: e.name,
        detail: e.prescription,
      }))
  }
  return exercises.map((e, i) => ({
    label: `Min ${i + 1}`,
    exo: e.name,
    detail: e.prescription,
  }))
}
