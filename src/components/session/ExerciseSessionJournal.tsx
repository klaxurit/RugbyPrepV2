import type { ExerciseSessionJournal, JournalSetRow } from '../../services/session/buildExerciseSessionJournal'
import { tr, type Lang } from '../../i18n/appLabels'
import { Icon } from '../ui'

interface ExerciseSessionJournalProps {
  journal: ExerciseSessionJournal
  lang: Lang
}

function JournalRow({ row }: { row: JournalSetRow }) {
  const isHistory = row.state === 'history'
  const isActive = row.state === 'current_active'
  const isDone = row.state === 'current_done'

  return (
    <div
      className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 ${
        isActive ? 'bg-brand/10 ring-1 ring-brand/25' : isHistory ? 'opacity-60' : ''
      }`}
      data-testid={`journal-row-${row.state}`}
    >
      <span
        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md text-[10px] font-extrabold tabular-nums ${
          isDone
            ? 'bg-win text-on-brand'
            : isActive
              ? 'bg-brand text-on-brand'
              : 'bg-layer-20 text-fg/50'
        }`}
      >
        {isDone ? (
          <Icon name="check" size={11} color="currentColor" strokeWidth={3} />
        ) : (
          row.setNumber
        )}
      </span>
      <span
        className={`flex-1 text-[12px] font-semibold tabular-nums ${
          isHistory ? 'text-fg/55' : isActive ? 'text-fg' : 'text-fg/70'
        }`}
      >
        {row.label}
      </span>
      {isHistory && (
        <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-fg/35">
          PREV
        </span>
      )}
    </div>
  )
}

export function ExerciseSessionJournalPanel({ journal, lang }: ExerciseSessionJournalProps) {
  const hasLast = journal.lastSessionRows.length > 0
  const hasCurrent = journal.currentRows.length > 0

  return (
    <div
      className="flex flex-col gap-2 rounded-xl border border-paper-deep bg-layer-5/80 p-2.5"
      data-testid="exo-session-journal"
    >
      {hasLast && (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 px-1 pb-0.5">
            <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-fg/45">
              {tr('exercise_journal_last_session', lang)}
            </span>
            {journal.lastSessionDate && (
              <span className="text-[9px] font-medium text-fg/35">{journal.lastSessionDate}</span>
            )}
          </div>
          {journal.lastSessionRows.map((row) => (
            <JournalRow key={`h-${row.setNumber}`} row={row} />
          ))}
        </div>
      )}

      {hasLast && hasCurrent && <div className="h-px bg-paper-deep" />}

      {hasCurrent && (
        <div className="flex flex-col gap-0.5">
          <span className="px-1 pb-0.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-brand/70">
            {tr('exercise_journal_current_session', lang)}
          </span>
          {journal.currentRows.map((row) => (
            <JournalRow key={`c-${row.setNumber}`} row={row} />
          ))}
        </div>
      )}
    </div>
  )
}
