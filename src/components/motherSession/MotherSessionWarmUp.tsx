import type { WarmUp } from '../../types/motherSession'
import type { AppLang } from '../../services/motherSession/motherSessionLabels'
import { msLabel, stripBackticks } from '../../services/motherSession/motherSessionLabels'
import { MotherSessionCollapsible } from './MotherSessionCollapsible'

type FrWarmUp = {
  exercises: Array<{ name: string; prescription?: string }>
  notes: string[]
}

type MotherSessionWarmUpProps = {
  warmUp: WarmUp
  lang?: AppLang
  frWarmUp?: FrWarmUp
}

function formatWarmUpExerciseName(name: string): string {
  return name.replace(
    /(^|[\s-/])([A-Za-zÀ-ÖØ-öø-ÿ])/g,
    (_unused, prefix: string, letter: string) => `${prefix}${letter.toUpperCase()}`
  )
}

export function MotherSessionWarmUp({ warmUp, lang = 'fr', frWarmUp }: MotherSessionWarmUpProps) {
  const hasContent = warmUp.exercises.length > 0 || warmUp.notes.length > 0
  if (!hasContent) return null

  const notes = frWarmUp?.notes ?? warmUp.notes

  return (
    <MotherSessionCollapsible title={msLabel('warm_up', lang)} defaultOpen={false}>
      {warmUp.exercises.length > 0 ? (
        <ul className="space-y-2">
          {warmUp.exercises.map((ex, i) => (
            <li key={`${ex.name}-${i}`} className="flex flex-col gap-0.5 border-b border-border-app pb-2 last:border-0 last:pb-0">
              <span className="font-medium text-fg">
                {formatWarmUpExerciseName(stripBackticks(frWarmUp?.exercises[i]?.name ?? ex.name))}
              </span>
              {(frWarmUp?.exercises[i]?.prescription ?? ex.prescription) ? (
                <span className="text-fg-secondary">
                  {stripBackticks(frWarmUp?.exercises[i]?.prescription ?? ex.prescription)}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {notes.length > 0 ? (
        <div className={warmUp.exercises.length > 0 ? 'mt-4' : ''}>
          <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{msLabel('notes', lang)}</p>
          <ul className="mt-2 space-y-1.5">
            {notes.map((note, i) => (
              <li key={i} className="text-sm text-fg-muted">
                {stripBackticks(note)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </MotherSessionCollapsible>
  )
}
