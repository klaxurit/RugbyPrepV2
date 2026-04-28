import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Eye } from 'lucide-react'
import type { Block } from '../../types/motherSession'
import type { AppLang } from '../../services/motherSession/motherSessionLabels'
import type { ExerciseLogEntry } from '../../types/training'
import type { LoadSuggestion } from '../../services/loadSuggestion'
import { useSessionRun, buildExerciseTourKey, type ExerciseTourLoad } from '../../contexts/SessionRunContext'
import { isDirectiveText, resolveExerciseId } from '../../services/motherSession/motherSessionExerciseMap'
import { getExerciseMetricType } from '../../services/ui/exerciseMetrics'
import { getExerciseName, hasExerciseDemo } from '../../data/exercises'
import {
  parseBlockTourCount,
  parseBlockRestSeconds,
  perTourPrescription,
} from '../../services/ui/blockPresentation'

interface SessionTourTrackerProps {
  block: Block
  lang: AppLang
  /** Prop frBlock.exercises utilisé pour afficher les noms FR (fallback block.exercises). */
  frExerciseNames?: (string | undefined)[]
  isPremium: boolean
  /** Dernière entrée loggée par exerciseId — Premium uniquement pour pré-remplir. */
  getLastEntryForExercise?: (exerciseId: string) => ExerciseLogEntry | undefined
  /** Callback déclenché quand tous les tours du bloc sont complétés. */
  onBlockCompleted?: () => void
  /** Callback pour ouvrir la démo vidéo d'un exercice — utilisé pendant la séance active. */
  onOpenDemo?: (exerciseId: string) => void
  /** Premium uniquement — suggestion de surcharge progressive par exercice. */
  getLoadSuggestion?: (exerciseId: string) => LoadSuggestion | undefined
}

/**
 * Tracker par TOURS pour un bloc en cours d'exécution.
 *
 * Modélisation :
 *  - Un bloc = N tours. Chaque tour enchaîne tous les exos loggables dans l'ordre,
 *    sans repos interne.
 *  - Le rest timer se déclenche UNE FOIS par tour, au tap de l'exo final du tour.
 *  - Pattern accordéon : seul le tour actif est déplié ; les autres collapsés.
 *  - Auto-avance : à l'expiration du repos (ou au skip), le tour suivant s'ouvre.
 */
export function SessionTourTracker({
  block,
  lang,
  frExerciseNames,
  isPremium,
  getLastEntryForExercise,
  onBlockCompleted,
  onOpenDemo,
  getLoadSuggestion,
}: SessionTourTrackerProps) {
  const sessionRun = useSessionRun()

  const tourCount = useMemo(() => parseBlockTourCount(block), [block])
  const restSeconds = useMemo(() => parseBlockRestSeconds(block), [block])

  // Liste des exos loggables du bloc (les directives type "3 tours" sont filtrées).
  // exerciseId est résolu depuis le nom anglais via le map MS si non fourni explicitement
  // — sans ça, hasExerciseDemo() reçoit une chaîne vide et l'œil disparaît.
  const loggableExercises = useMemo(() => {
    return block.exercises
      .map((ex, idx) => {
        if (isDirectiveText(ex.name)) return null
        const exerciseId = ex.exerciseId ?? resolveExerciseId(ex.name) ?? ''
        return { ex, idx, exerciseId }
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
  }, [block.exercises])

  const resolveName = (exerciseId: string, fallback: string, idx: number): string => {
    if (exerciseId) {
      const resolved = getExerciseName(exerciseId, lang)
      if (resolved && resolved !== exerciseId) return resolved
    }
    return frExerciseNames?.[idx] ?? fallback
  }

  // Nombre d'exos validés par tour (pour afficher progress "X/Y" par tour).
  const doneByTour = useMemo(() => {
    const counts = Array<number>(tourCount).fill(0)
    for (const key of sessionRun.completedExercises) {
      const parts = key.split('_')
      if (parts.length !== 3) continue
      const [b, t] = parts.map(Number)
      if (b !== block.number) continue
      if (t >= 0 && t < tourCount) counts[t] += 1
    }
    return counts
  }, [sessionRun.completedExercises, block.number, tourCount])

  // Tour actif = premier tour non complet. Si tous complets → null (bloc terminé).
  const activeTourIndex = useMemo(() => {
    const perTourTotal = loggableExercises.length
    for (let t = 0; t < tourCount; t++) {
      if (doneByTour[t] < perTourTotal) return t
    }
    return null
  }, [doneByTour, tourCount, loggableExercises.length])

  // Toggle manuel : l'user peut déplier un tour précédent/suivant pour consulter.
  const [manualOpenIndex, setManualOpenIndex] = useState<number | null>(null)
  // Effect : remet à null manualOpen quand le tour actif change — la nav est automatique.
  const previousActiveRef = useRef<number | null>(activeTourIndex)
  useEffect(() => {
    if (activeTourIndex !== previousActiveRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: reset manual expansion when auto-active tour changes
      setManualOpenIndex(null)
      previousActiveRef.current = activeTourIndex
    }
  }, [activeTourIndex])

  // Auto-notifier onBlockCompleted quand tous les tours sont bouclés.
  const completedNotifiedRef = useRef(false)
  useEffect(() => {
    if (activeTourIndex === null) {
      if (!completedNotifiedRef.current) {
        completedNotifiedRef.current = true
        onBlockCompleted?.()
      }
    } else {
      completedNotifiedRef.current = false
    }
  }, [activeTourIndex, onBlockCompleted])

  const handleToggleExercise = (tourIndex: number, exerciseIndex: number, exerciseName: string) => {
    const key = buildExerciseTourKey(block.number, tourIndex, exerciseIndex)
    const wasDone = sessionRun.completedExercises.has(key)
    if (wasDone) {
      sessionRun.unmarkExerciseDone(key)
      return
    }
    sessionRun.markExerciseDone(key)
    // Si cet exo était le dernier restant du tour → déclencher le chrono de repos,
    // sauf si c'est le dernier tour du bloc (plus rien après).
    const remaining = loggableExercises.length - (doneByTour[tourIndex] + 1)
    const isLastTour = tourIndex >= tourCount - 1
    if (remaining === 0 && !isLastTour) {
      sessionRun.startRestTimer(restSeconds, `Fin du tour ${tourIndex + 1}`)
    }
    // Note : onBlockCompleted est géré via l'useEffect (évite un double appel sur les toggles rapides).
    void exerciseName
  }

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between text-[11px] font-bold text-fg-muted">
        <span>
          {tourCount} tour{tourCount > 1 ? 's' : ''}
          {' · Repos '}
          {restSeconds >= 60 ? `${Math.round(restSeconds / 60)} min` : `${restSeconds}s`}
          {' entre les tours'}
        </span>
        {activeTourIndex !== null && (
          <span className="text-brand-tint font-black uppercase tracking-wider">
            Tour {activeTourIndex + 1}/{tourCount}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {Array.from({ length: tourCount }).map((_, tourIndex) => {
          const isActive = tourIndex === activeTourIndex
          const isOpen = isActive || manualOpenIndex === tourIndex
          const doneCount = doneByTour[tourIndex]
          const isCompleted = doneCount >= loggableExercises.length && loggableExercises.length > 0

          return (
            <TourPanel
              key={tourIndex}
              tourIndex={tourIndex}
              totalExercises={loggableExercises.length}
              doneCount={doneCount}
              isActive={isActive}
              isOpen={isOpen}
              isCompleted={isCompleted}
              onToggleOpen={() => {
                if (isActive) return
                setManualOpenIndex((prev) => (prev === tourIndex ? null : tourIndex))
              }}
            >
              <ul className="mt-2 space-y-1.5">
                {loggableExercises.map(({ ex, idx, exerciseId }, orderInTour) => {
                  const key = buildExerciseTourKey(block.number, tourIndex, idx)
                  const isDone = sessionRun.completedExercises.has(key)
                  const isCurrent = isActive && !isDone && doneCount === orderInTour
                  const displayName = resolveName(exerciseId, ex.name, idx)
                  const tourPrescription = perTourPrescription(ex.prescription)
                  const metric = exerciseId ? getExerciseMetricType({ exerciseId }) : 'load_reps'
                  const showLoadInputs = isPremium && metric === 'load_reps'
                  const canShowDemo = Boolean(exerciseId && hasExerciseDemo(exerciseId))
                  const isFirstTour = tourIndex === 0
                  const suggestion = isFirstTour && exerciseId && getLoadSuggestion
                    ? getLoadSuggestion(exerciseId)
                    : undefined
                  const showSuggestionBadge = !!suggestion
                    && suggestion.decision !== 'no_suggestion'
                    && suggestion.decision !== 'no_data'
                  return (
                    <li
                      key={`${tourIndex}-${idx}`}
                      className={`rounded-xl px-3 py-2 transition-colors border ${
                        isDone
                          ? 'bg-ok-bg-muted border-ok-bd'
                          : isCurrent
                            ? 'bg-brand-soft border-brand-border-strong'
                            : 'bg-layer-2 border-border-app'
                      }`}
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleExercise(tourIndex, idx, displayName)}
                            aria-pressed={isDone}
                            aria-label={isDone ? `Annuler ${displayName}` : `Valider ${displayName}`}
                            className={`flex-shrink-0 w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all rf-focus-ring ${
                              isDone
                                ? 'bg-ok-strong border-ok-strong text-white scale-100'
                                : isCurrent
                                  ? 'border-brand bg-brand-soft text-brand hover:bg-brand hover:text-on-brand'
                                  : 'border-border-app bg-layer-5 text-fg-ghost hover:border-brand-border-strong'
                            }`}
                          >
                            {isDone && <Check className="w-5 h-5" strokeWidth={3} />}
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-bold ${isDone ? 'text-fg-muted line-through' : 'text-fg'}`}>
                              {displayName}
                            </p>
                            <p className="text-xs text-fg-secondary">{tourPrescription}</p>
                          </div>
                          {canShowDemo && exerciseId && onOpenDemo && (
                            <button
                              type="button"
                              onClick={() => onOpenDemo(exerciseId)}
                              aria-label={`Voir l'exécution de ${displayName}`}
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-border-app bg-layer-5 text-fg-muted transition-colors hover:border-brand-border-strong hover:text-brand-tint"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        {showSuggestionBadge && suggestion && (
                          <SuggestionBadge suggestion={suggestion} />
                        )}
                        {showLoadInputs && (
                          <div className="pl-13 flex justify-end">
                            <ExerciseTourInputs
                              tourKey={key}
                              lastEntry={getLastEntryForExercise?.(exerciseId)}
                              disabled={isDone}
                            />
                          </div>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </TourPanel>
          )
        })}
      </div>
    </div>
  )
}

function TourPanel({
  tourIndex,
  totalExercises,
  doneCount,
  isActive,
  isOpen,
  isCompleted,
  onToggleOpen,
  children,
}: {
  tourIndex: number
  totalExercises: number
  doneCount: number
  isActive: boolean
  isOpen: boolean
  isCompleted: boolean
  onToggleOpen: () => void
  children: React.ReactNode
}) {
  const label = isCompleted
    ? `Tour ${tourIndex + 1} · terminé`
    : isActive
      ? `Tour ${tourIndex + 1} · en cours`
      : `Tour ${tourIndex + 1} · à venir`

  return (
    <section
      className={`rounded-2xl border overflow-hidden ${
        isActive
          ? 'border-brand-border-strong bg-layer-5 shadow-sm'
          : isCompleted
            ? 'border-ok-bd bg-ok-bg-muted/40'
            : 'border-border-app bg-layer-2'
      }`}
    >
      <button
        type="button"
        onClick={onToggleOpen}
        disabled={isActive}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left disabled:cursor-default rf-focus-ring"
      >
        <div className="flex items-center gap-2 min-w-0">
          {isCompleted ? (
            <span className="w-5 h-5 rounded-full bg-ok-strong flex items-center justify-center flex-shrink-0">
              <Check className="w-3 h-3 text-white" strokeWidth={3} />
            </span>
          ) : (
            <span
              className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${isActive ? 'border-brand bg-brand' : 'border-border-app bg-transparent'}`}
            />
          )}
          <span className={`text-xs font-black uppercase tracking-wider ${
            isCompleted ? 'text-ok-strong' : isActive ? 'text-brand-tint' : 'text-fg-muted'
          }`}>
            {label}
          </span>
          {!isActive && totalExercises > 0 && (
            <span className="text-[10px] font-bold text-fg-muted tabular-nums">
              {doneCount}/{totalExercises}
            </span>
          )}
        </div>
        {!isActive && (
          <ChevronDown className={`w-4 h-4 text-fg-faint transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>
      {isOpen && <div className="px-3 pb-3">{children}</div>}
    </section>
  )
}

/**
 * Premium uniquement — mini inputs kg/reps pour une étape d'exercice-tour.
 * Pas de pré-remplissage par lignes : on se base sur `lastEntry` en placeholder
 * (pas envahissant, et laisse l'athlète ajuster rapidement).
 */
function ExerciseTourInputs({
  tourKey,
  lastEntry,
  disabled,
}: {
  tourKey: string
  lastEntry: ExerciseLogEntry | undefined
  disabled: boolean
}) {
  const sessionRun = useSessionRun()
  const current = sessionRun.exerciseTourLoads[tourKey] ?? {}

  const update = (patch: ExerciseTourLoad) => {
    sessionRun.setExerciseTourLoad(tourKey, patch)
  }

  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      <input
        type="number"
        inputMode="decimal"
        step={1.25}
        min={0}
        value={current.loadKg ?? ''}
        onChange={(e) => {
          const raw = e.target.value
          update({ loadKg: raw === '' ? undefined : Math.max(0, Number(raw)) })
        }}
        disabled={disabled}
        placeholder={lastEntry?.loadKg?.toString() ?? 'kg'}
        className="w-14 rounded-lg border border-border-app bg-layer-5 px-1.5 py-1 text-sm text-fg text-center focus:border-brand focus:outline-none disabled:opacity-60"
        aria-label="Charge (kg)"
      />
      <span className="text-[10px] text-fg-muted">×</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={current.reps ?? ''}
        onChange={(e) => {
          const raw = e.target.value
          update({ reps: raw === '' ? undefined : Math.max(0, Number(raw)) })
        }}
        disabled={disabled}
        placeholder={lastEntry?.reps?.toString() ?? 'reps'}
        className="w-12 rounded-lg border border-border-app bg-layer-5 px-1.5 py-1 text-sm text-fg text-center focus:border-brand focus:outline-none disabled:opacity-60"
        aria-label="Reps"
      />
    </div>
  )
}

/**
 * Premium uniquement — badge "↑ +5 kg" affiché sur le tour 1 d'un exercice.
 * Lecture des suggestions venant du moteur loadSuggestion (KB rugby).
 */
function SuggestionBadge({ suggestion }: { suggestion: LoadSuggestion }) {
  const decisionStyle: Record<LoadSuggestion['decision'], { icon: string; cls: string }> = {
    increase:      { icon: '↑', cls: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' },
    decrease:      { icon: '↓', cls: 'border-red-400/40 bg-red-400/10 text-red-300' },
    maintain:      { icon: '→', cls: 'border-border-app bg-layer-5 text-fg-muted' },
    bodyweight:    { icon: '●', cls: 'border-blue-400/40 bg-blue-400/10 text-blue-300' },
    no_data:       { icon: '○', cls: 'border-border-app bg-layer-5 text-fg-faint' },
    no_suggestion: { icon: '',  cls: '' },
  }
  const style = decisionStyle[suggestion.decision]
  const target =
    suggestion.suggestedWeight !== null
      ? `${suggestion.suggestedWeight} kg`
      : suggestion.suggestedReps !== null
        ? `${suggestion.suggestedReps} reps`
        : ''
  return (
    <div
      className={`pl-13 flex items-start gap-2 rounded-lg border px-2.5 py-1.5 ${style.cls}`}
      data-testid="suggestion-badge"
    >
      <span className="text-sm font-bold leading-none">{style.icon}</span>
      <div className="min-w-0 flex-1">
        {target && <p className="text-[11px] font-bold leading-tight">{target}</p>}
        <p className="text-[10px] leading-tight opacity-80">{suggestion.justification}</p>
      </div>
    </div>
  )
}
