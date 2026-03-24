import type { MotherSession } from '../../types/motherSession'
import type { BlockLog, ExerciseLogEntry, SessionType, CycleWeek, FatigueStatus } from '../../types/training'
import type { AppLang } from '../../services/motherSession/motherSessionLabels'
import { msLabel, stripBackticks } from '../../services/motherSession/motherSessionLabels'
import { getSessionFr } from '../../services/motherSession/motherSessionContentFr'
import { MotherSessionBlock } from './MotherSessionBlock'
import { MotherSessionCollapsible } from './MotherSessionCollapsible'
import { MotherSessionHeader } from './MotherSessionHeader'
import { MotherSessionInjurySubs } from './MotherSessionInjurySubs'
import { MotherSessionWarmUp } from './MotherSessionWarmUp'

type MotherSessionViewProps = {
  session: MotherSession
  lang?: AppLang
  injuries?: string[]
  // Logging props
  sessionType?: SessionType
  week?: CycleWeek
  fatigue?: FatigueStatus
  onSaveBlock?: (log: Omit<BlockLog, 'id'>) => void
  getLastEntryForExercise?: (exerciseId: string) => ExerciseLogEntry | undefined
  // Premium load suggestion
  isPremium?: boolean
  acwr?: number | null
  isRehabActive?: boolean
}

export function MotherSessionView({ session, lang = 'fr', injuries, sessionType, week, fatigue, onSaveBlock, getLastEntryForExercise, isPremium, acwr, isRehabActive }: MotherSessionViewProps) {
  const frContent = lang === 'fr' ? getSessionFr(session.metadata.id) : undefined

  const hasProgressionRules = (frContent?.progressionRules ?? session.progressionRules).length > 0
  const hasPositionAccent = (frContent?.positionAccent ?? session.positionAccent).length > 0
  const showUnderstand = hasProgressionRules || hasPositionAccent

  // Injury subs: only render if player has declared injuries
  const showInjurySubs = injuries != null && injuries.length > 0

  return (
    <div className="min-w-0 max-w-[min(100%,28rem)] space-y-4 p-3 text-white sm:p-4">
      <MotherSessionHeader metadata={session.metadata} lang={lang} />

      <MotherSessionWarmUp
        warmUp={session.warmUp}
        lang={lang}
        frWarmUp={frContent ? { exercises: frContent.warmUpExercises, notes: frContent.warmUpNotes } : undefined}
      />

      <section className="space-y-3" aria-label="Training blocks">
        {session.blocks.map((block, i) => (
          <MotherSessionBlock
            key={block.number}
            block={block}
            lang={lang}
            frBlock={frContent?.blocks[i]}
            motherSessionId={session.metadata.id}
            sessionType={sessionType}
            week={week}
            fatigue={fatigue}
            onSaveBlock={onSaveBlock}
            getLastEntryForExercise={getLastEntryForExercise}
            isPremium={isPremium}
            acwr={acwr}
            isRehabActive={isRehabActive}
          />
        ))}
      </section>

      {/* "Comprendre cette séance" — FIX F4-2: non rendu si les deux sont vides */}
      {showUnderstand && (
        <MotherSessionCollapsible title={msLabel('understand_session', lang)} defaultOpen={false}>
          {hasProgressionRules && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-2">
                {msLabel('progression_rules', lang)}
              </p>
              <ul className="space-y-2 mb-4">
                {(frContent?.progressionRules ?? session.progressionRules).map((rule, i) => (
                  <li key={i} className="text-sm text-white/70">
                    {stripBackticks(rule)}
                  </li>
                ))}
              </ul>
            </>
          )}
          {hasPositionAccent && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-2">
                {msLabel('position_accent', lang)}
              </p>
              <ul className="space-y-2">
                {(frContent?.positionAccent ?? session.positionAccent).map((line, i) => (
                  <li key={i} className="text-sm text-white/70">
                    {stripBackticks(line)}
                  </li>
                ))}
              </ul>
            </>
          )}
        </MotherSessionCollapsible>
      )}

      {showInjurySubs && (
        <MotherSessionInjurySubs injurySubstitutions={session.injurySubstitutions} lang={lang} />
      )}

      {(frContent?.coachingWarnings ?? session.coachingWarnings).length > 0 ? (
        <MotherSessionCollapsible title={msLabel('coaching_warnings', lang)} defaultOpen={false}>
          <ul className="space-y-2">
            {(frContent?.coachingWarnings ?? session.coachingWarnings).map((w, i) => (
              <li key={i} className="text-sm text-white/70">
                {stripBackticks(w)}
              </li>
            ))}
          </ul>
        </MotherSessionCollapsible>
      ) : null}
    </div>
  )
}
