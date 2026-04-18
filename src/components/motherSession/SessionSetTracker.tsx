import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Plus, Minus, Lock } from 'lucide-react'
import type { SetEntry } from '../../contexts/SessionRunContext'
import { useSessionRun } from '../../contexts/SessionRunContext'
import type { ExerciseLogEntry } from '../../types/training'
import { PremiumSheet } from '../modals/PremiumSheet'

interface SessionSetTrackerProps {
  exerciseKey: string
  exerciseName: string
  /** Prescription texte (ex. "4×8 @ 85%") — utilisé pour parser le nombre de sets par défaut. */
  prescription?: string
  /** Dernière entrée persistée — base de la progression overload. */
  lastEntry?: ExerciseLogEntry
  /** Affiche les inputs kg. Désactive pour BW / exercices sans charge. */
  showLoad?: boolean
  /** Affiche les inputs reps. Désactive pour isométriques / distances. */
  showReps?: boolean
  /** Free = checkboxes uniquement + CTA Premium contextuel. Premium = inputs kg/reps visibles. */
  isPremium?: boolean
}

/**
 * Parse une prescription type "4×8", "3x10-12", "5×5 @ 85%" pour extraire le nombre de sets.
 * Retourne null si non détecté.
 */
function parseTargetSets(prescription?: string): number | null {
  if (!prescription) return null
  const match = prescription.match(/^\s*(\d+)\s*[x×]/i)
  if (!match) return null
  const n = Number(match[1])
  return Number.isFinite(n) && n > 0 && n <= 12 ? n : null
}

function parseTargetReps(prescription?: string): number | null {
  if (!prescription) return null
  const match = prescription.match(/[x×]\s*(\d+)/i)
  if (!match) return null
  const n = Number(match[1])
  return Number.isFinite(n) && n > 0 ? n : null
}

/**
 * Parse a rest duration from the prescription if annotated like "@90s", "@2min", "repos 2 min".
 * Returns null if not detected — caller decides on a default.
 */
function parseRestSeconds(prescription?: string): number | null {
  if (!prescription) return null
  // "@90s", "@ 90s", "(90s)"
  const sec = prescription.match(/(?:@|\()\s*(\d+)\s*s\b/i)
  if (sec) {
    const n = Number(sec[1])
    return Number.isFinite(n) ? n : null
  }
  // "@2min", "repos 2 min", "repos complet 3 min", "repos 1-2 min" (prend la borne basse)
  const min = prescription.match(/(?:@|repos(?:\s+\w+)?)\s*(\d+)(?:\s*[-–]\s*\d+)?\s*min/i)
  if (min) {
    const n = Number(min[1])
    return Number.isFinite(n) ? n * 60 : null
  }
  return null
}

/**
 * Tracker set-par-set pour une séance en cours.
 * Pré-remplit les kg/reps avec la dernière séance loggée (progression overload).
 * Auto-coche l'exercice parent dans SessionRunContext quand tous les sets sont validés.
 */
export function SessionSetTracker({
  exerciseKey,
  exerciseName,
  prescription,
  lastEntry,
  showLoad = true,
  showReps = true,
  isPremium = true,
}: SessionSetTrackerProps) {
  const sessionRun = useSessionRun()
  const sets = sessionRun.perExerciseSets[exerciseKey]
  const [premiumSheetOpen, setPremiumSheetOpen] = useState(false)

  const targetSets = useMemo(() => parseTargetSets(prescription) ?? 3, [prescription])
  const targetReps = useMemo(() => parseTargetReps(prescription), [prescription])
  const restSeconds = useMemo(() => parseRestSeconds(prescription) ?? 90, [prescription])

  // Initialisation : si pas encore de sets, créer `targetSets` lignes pré-remplies.
  // Pour les Free : pas de kg/reps pré-remplis (feature Premium).
  // On calcule les defaults de manière mémoïsée pour éviter les ré-calculs inutiles et
  // on s'assure que l'affichage est stable dès le 1er render (pas d'écran vide entre
  // le mount et l'effet d'init).
  const defaultSets = useMemo<SetEntry[]>(
    () =>
      Array.from({ length: targetSets }, () => ({
        loadKg: isPremium ? lastEntry?.loadKg : undefined,
        reps: isPremium ? (lastEntry?.reps ?? targetReps ?? undefined) : undefined,
        done: false,
      })),
    [targetSets, targetReps, lastEntry, isPremium],
  )
  const currentSets = sets ?? defaultSets

  const initializedRef = useRef(false)
  useEffect(() => {
    if (initializedRef.current) return
    if (sets != null) {
      initializedRef.current = true
      return
    }
    sessionRun.setExerciseSets(exerciseKey, defaultSets)
    initializedRef.current = true
  }, [sets, defaultSets, exerciseKey, sessionRun])

  // Auto-mark exercise as done when every set is validated (once at least 1 set exists)
  useEffect(() => {
    if (currentSets.length === 0) return
    const allDone = currentSets.every((s) => s.done)
    const isMarkedDone = sessionRun.completedExercises.has(exerciseKey)
    if (allDone && !isMarkedDone) {
      sessionRun.markExerciseDone(exerciseKey)
    } else if (!allDone && isMarkedDone) {
      sessionRun.unmarkExerciseDone(exerciseKey)
    }
  }, [currentSets, exerciseKey, sessionRun])

  const handleAddSet = () => {
    const lastSet = currentSets[currentSets.length - 1]
    const newSet: SetEntry = {
      loadKg: lastSet?.loadKg ?? lastEntry?.loadKg,
      reps: lastSet?.reps ?? lastEntry?.reps ?? targetReps ?? undefined,
      done: false,
    }
    sessionRun.setExerciseSets(exerciseKey, [...currentSets, newSet])
  }

  const handleRemoveSet = () => {
    if (currentSets.length <= 1) return
    sessionRun.setExerciseSets(exerciseKey, currentSets.slice(0, -1))
  }

  const completed = currentSets.filter((s) => s.done).length

  return (
    <div className="rounded-2xl border border-border-app bg-layer-5 p-3 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-fg truncate">{exerciseName}</p>
        <span className={`text-[11px] font-black tracking-tight ${completed === currentSets.length && currentSets.length > 0 ? 'text-ok-strong' : 'text-fg-muted'}`}>
          {completed} / {currentSets.length}
        </span>
      </div>

      {isPremium && lastEntry && (
        <p className="text-[10px] text-fg-faint">
          Dernière fois : {lastEntry.loadKg != null ? `${lastEntry.loadKg} kg × ` : ''}
          {lastEntry.reps ?? '—'} reps
        </p>
      )}

      <div className="space-y-1.5">
        {currentSets.map((set, idx) => (
          <SetRow
            key={idx}
            setNumber={idx + 1}
            entry={set}
            showLoad={showLoad}
            showReps={showReps}
            isPremium={isPremium}
            onChange={(patch) => {
              sessionRun.updateExerciseSet(exerciseKey, idx, patch)
              // Démarrer le chrono de repos quand on valide une série, sauf si c'est la dernière.
              const justValidated = patch.done === true && !set.done
              const isLastSet = idx === currentSets.length - 1
              if (justValidated && !isLastSet) {
                sessionRun.startRestTimer(restSeconds, exerciseName)
              }
            }}
          />
        ))}
      </div>

      {restSeconds > 0 && (
        <p className="text-[10px] text-fg-muted">
          Repos prévu : {restSeconds >= 60 ? `${Math.round(restSeconds / 60)} min` : `${restSeconds}s`}
        </p>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={handleAddSet}
          className="flex items-center gap-1 text-[11px] font-bold text-brand-tint hover:text-brand-hover rf-focus-ring rounded-lg px-2 py-1"
        >
          <Plus className="w-3.5 h-3.5" /> Série
        </button>
        {currentSets.length > 1 && (
          <button
            type="button"
            onClick={handleRemoveSet}
            className="flex items-center gap-1 text-[11px] font-bold text-fg-muted hover:text-alert rf-focus-ring rounded-lg px-2 py-1"
          >
            <Minus className="w-3.5 h-3.5" /> Série
          </button>
        )}
      </div>

      {/* Paywall contextuel — 1 par exo max, sous les cases, uniquement pour Free. */}
      {!isPremium && showLoad && (
        <button
          type="button"
          onClick={() => setPremiumSheetOpen(true)}
          className="flex items-center gap-1.5 text-[11px] font-bold text-brand-tint hover:text-brand-hover transition-colors rf-focus-ring rounded-lg"
        >
          <Lock className="w-3 h-3" />
          Logger mes kg/reps avec Premium →
        </button>
      )}

      <PremiumSheet
        isOpen={premiumSheetOpen}
        onClose={() => setPremiumSheetOpen(false)}
        feature="Suivi des charges"
        benefit="Note tes charges (kg) et reps pour chaque série. L'app te suggère ta charge optimale pour la séance suivante et trace ta progression semaine après semaine."
      />
    </div>
  )
}

function SetRow({
  setNumber,
  entry,
  showLoad,
  showReps,
  isPremium,
  onChange,
}: {
  setNumber: number
  entry: SetEntry
  showLoad: boolean
  showReps: boolean
  isPremium: boolean
  onChange: (patch: Partial<SetEntry>) => void
}) {
  return (
    <div className={`flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors ${entry.done ? 'bg-ok-bg-muted border border-ok-bd' : 'bg-layer-2 border border-border-app'}`}>
      <span className={`w-6 text-center text-[11px] font-black ${entry.done ? 'text-ok-strong' : 'text-fg-muted'}`}>
        {setNumber}
      </span>
      {!isPremium && (
        <span className={`text-xs font-medium flex-1 ${entry.done ? 'text-fg-muted line-through' : 'text-fg-secondary'}`}>
          Série {setNumber}
        </span>
      )}
      {isPremium && showLoad && (
        <div className="flex items-center gap-1 min-w-0">
          <input
            type="number"
            inputMode="decimal"
            step={1.25}
            min={0}
            value={entry.loadKg ?? ''}
            onChange={(e) => {
              const raw = e.target.value
              onChange({ loadKg: raw === '' ? undefined : Math.max(0, Number(raw)) })
            }}
            disabled={entry.done}
            className="w-14 rounded-lg border border-border-app bg-layer-5 px-1.5 py-1 text-sm text-fg text-center focus:border-brand focus:outline-none disabled:opacity-60"
            aria-label={`Série ${setNumber} charge en kg`}
          />
          <span className="text-[10px] text-fg-muted">kg</span>
        </div>
      )}
      {isPremium && showReps && (
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-[10px] text-fg-muted">×</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={entry.reps ?? ''}
            onChange={(e) => {
              const raw = e.target.value
              onChange({ reps: raw === '' ? undefined : Math.max(0, Number(raw)) })
            }}
            disabled={entry.done}
            className="w-12 rounded-lg border border-border-app bg-layer-5 px-1.5 py-1 text-sm text-fg text-center focus:border-brand focus:outline-none disabled:opacity-60"
            aria-label={`Série ${setNumber} reps`}
          />
          <span className="text-[10px] text-fg-muted">reps</span>
        </div>
      )}
      <button
        type="button"
        onClick={() => onChange({ done: !entry.done })}
        aria-pressed={entry.done}
        aria-label={entry.done ? `Annuler série ${setNumber}` : `Valider série ${setNumber}`}
        className={`ml-auto flex-shrink-0 w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-colors rf-focus-ring ${
          entry.done
            ? 'bg-ok-strong border-ok-strong text-white'
            : 'border-border-app bg-layer-5 text-fg-ghost hover:border-brand-border-strong hover:text-brand-tint'
        }`}
      >
        {entry.done && <Check className="w-4 h-4" strokeWidth={3} />}
      </button>
    </div>
  )
}
