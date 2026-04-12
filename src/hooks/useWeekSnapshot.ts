/**
 * Hook managing the stable week snapshot lifecycle.
 *
 * Wraps `useWeeklyProgramSurface` to add intra-week stability:
 * - snapshot created on first access or week change
 * - persisted in localStorage
 * - restored on navigation back if weekId still matches
 * - corrections (S3+) will patch the snapshot without full re-resolution
 *
 * Side effects (localStorage, blockProgression) happen in useEffect only.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CalendarEvent, DayOfWeek } from '../types/training'
import type { BlockProgressionState, WeekCorrection, WeekSnapshot } from '../types/scheduling'
import {
  resolveWeeklyProgramSurface,
  type WeeklyProgramSurfaceResult,
} from '../services/program/resolveWeeklyProgramSurface'
import { buildExplanation } from '../services/scheduling/buildExplanation'
import {
  useWeeklyProgramSurface,
  type UseWeeklyProgramSurfaceParams,
} from './useWeeklyProgramSurface'
import {
  resolveWeek,
  patchWeek,
  saveSnapshot,
  loadSnapshot,
  toISOWeekId,
  classifyExternalChange,
  rebuildWithoutCorrection,
  rebuildWithRemainingCorrections,
  computeGlobalEventsHash,
  expireCorrections,
  migrateSnapshot,
  type SnapshotStorage,
} from '../services/scheduling/weekSnapshot'
import { getBlockProgression, type BlockProgressionStorage } from '../services/scheduling/resolveBlockProgression'

// ── Public interface ────────────────────────────────────────────────

export interface UseWeekSnapshotParams extends UseWeeklyProgramSurfaceParams {
  /** Injectable storage for testing (snapshot persistence). */
  snapshotStorage?: SnapshotStorage
  /** Injectable storage for testing (block progression). */
  blockProgressionStorage?: BlockProgressionStorage
}

export interface UseWeekSnapshotResult {
  snapshot: WeekSnapshot | null
  isReady: boolean
  hasPendingUpdates: boolean
  hasConfirmationRequired: boolean
  /** Derived from snapshot for convenience — same as snapshot.surface. */
  surface: WeeklyProgramSurfaceResult | null
  /** Derived from snapshot for convenience. */
  blockProgression: BlockProgressionState | undefined
  /** Toast message to show after a correction. Auto-cleared after read. */
  toastMessage: string | null
  clearToast: () => void

  // ── Category A light corrections ──
  rescheduleSession: (sessionId: string, toDay: DayOfWeek) => void
  skipSession: (sessionId: string) => void
  markDayUnavailable: (day: DayOfWeek) => void
  undoCorrection: (correctionId: string) => void
  // ── Heavy corrections (re-run engine) ──
  setFatigue: (fatigue: 'OK' | 'FATIGUE') => void
  /** Call with the canonical created event returned by useCalendar.addEvent. */
  addMatch: (createdEvent: CalendarEvent) => void
  // ── External update handling ──
  confirmPendingUpdate: (updateId: string) => void
}

const DAY_LABELS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

let correctionCounter = 0
function nextCorrectionId(): string {
  return `c-${Date.now()}-${++correctionCounter}`
}

function computeProfileHash(profile: import('../types/training').UserProfile): string {
  const deferral = profile.seasonTransitionState?.activeDeferral
  const ack = profile.seasonTransitionState?.offseasonMatchResumeAckEventId
  return [
    profile.weeklySessions,
    profile.trainingLevel,
    profile.seasonMode,
    profile.planningAnchors?.seasonEndedAt ?? '',
    profile.planningAnchors?.returnToTeamTrainingAt ?? '',
    (profile.injuries ?? []).join(','),
    deferral ? `${deferral.eventId}:${deferral.expiresAt}` : '',
    ack ?? '',
  ].join('|')
}

// ── Hook ────────────────────────────────────────────────────────────

export function useWeekSnapshot(
  params: UseWeekSnapshotParams | null,
): UseWeekSnapshotResult {
  // 1. Upstream pure surface (computed via useMemo in the wrapped hook)
  const upstream = useWeeklyProgramSurface(params)

  // 2. Snapshot state
  const [snapshot, setSnapshot] = useState<WeekSnapshot | null>(null)
  const resolvedWeekRef = useRef<string>('')
  const lastGlobalHashRef = useRef<string>('')

  // F7: Keep refs to latest snapshot & params so callbacks never use stale closures
  const snapshotRef = useRef<WeekSnapshot | null>(null)
  const paramsRef = useRef<UseWeekSnapshotParams | null>(null)
  snapshotRef.current = snapshot
  paramsRef.current = params

  // 3. Resolve or restore snapshot in useEffect
  useEffect(() => {
    if (!upstream.isReady || !upstream.surface || !params) {
      setSnapshot(null)
      resolvedWeekRef.current = ''
      return
    }

    const userId = params.userId ?? null
    const currentWeekId = toISOWeekId(params.today)
    const snapshotStorage = params.snapshotStorage

    // Dedup: don't re-resolve if we already resolved this weekId for this identity + profile
    const profileHash = computeProfileHash(params.profile)
    const resolvedKey = `${userId ?? 'anon'}:${currentWeekId}:${profileHash}`
    if (resolvedWeekRef.current === resolvedKey && snapshot?.weekId === currentWeekId) {
      return
    }

    // Try to restore from localStorage if userId is available.
    // Skip restore if the profile has changed since the snapshot was saved
    // (e.g. user changed weeklySessions, trainingLevel, injuries in /profile).
    if (userId) {
      const persisted = loadSnapshot(userId, params.today, snapshotStorage)
      if (
        persisted &&
        persisted.weekId === currentWeekId &&
        // profileHash absent in old snapshots → always re-resolve (safe migration)
        persisted.profileHash === profileHash
      ) {
        // Migrate old snapshots to current schema (explanation, clubDays, schemaVersion)
        const profileClubDays = (params.profile.clubSchedule?.clubDays ?? []).map(
          (d: { day: DayOfWeek }) => d.day,
        ) as DayOfWeek[]
        const { snapshot: restored, changed } = migrateSnapshot(persisted, { profileClubDays })
        if (changed) {
          saveSnapshot(userId, restored, snapshotStorage)
        }
        setSnapshot(restored)
        resolvedWeekRef.current = resolvedKey
        // Seed from the PERSISTED baseline — allows the external change effect
        // to detect changes that happened while the user was away
        lastGlobalHashRef.current = restored.globalEventsHash ?? computeGlobalEventsHash(params.events)
        return
      }
    }

    // Compute block progression (side effect: may write to localStorage)
    let blockProgression: BlockProgressionState | undefined
    if (upstream.surface.schedulingMode === 'sequential' && userId) {
      blockProgression = getBlockProgression(
        userId,
        params.today,
        upstream.surface.planningContext,
        params.blockProgressionStorage,
      )
    }

    // Create fresh snapshot (pure) and stamp with profileHash for cache invalidation
    const fresh = {
      ...resolveWeek({
        surface: upstream.surface,
        events: params.events,
        today: params.today,
        clubSchedule: params.profile.clubSchedule,
        scSchedule: params.profile.scSchedule,
        previousSnapshot: snapshot,
        blockProgression,
      }),
      profileHash,
    }

    // Persist
    if (userId) {
      saveSnapshot(userId, fresh, snapshotStorage)
    }

    setSnapshot(fresh)
    resolvedWeekRef.current = resolvedKey
    // Seed the external change baseline so the detection effect doesn't fire on first load
    lastGlobalHashRef.current = computeGlobalEventsHash(params.events)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upstream.isReady, upstream.surface, params?.today, params?.userId])

  // ── F8: Active-snapshot correction expiry ──
  // Normalize reversibility based on 24h window so the undo affordance
  // disappears even if the page stays open past the expiry.
  const activeSnapshot = useMemo(() => {
    if (!snapshot) return null
    const expired = expireCorrections(snapshot.corrections)
    if (expired === snapshot.corrections) return snapshot
    return { ...snapshot, corrections: expired }
  }, [snapshot])
  // Keep the ref pointing to the expired version so undoCorrection checks
  // the up-to-date reversible flag.
  snapshotRef.current = activeSnapshot

  // ── Toast state ──
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const clearToast = useCallback(() => setToastMessage(null), [])

  // ── Correction helper: patch + persist + toast ──
  const applyCorrection = useCallback((correction: WeekCorrection, toast: string) => {
    const snap = snapshotRef.current
    const p = paramsRef.current
    if (!snap || !p) return
    const patched = patchWeek(snap, correction, {
      events: p.events,
      today: p.today,
      clubSchedule: p.profile.clubSchedule,
      scSchedule: p.profile.scSchedule,
    })
    setSnapshot(patched)
    const userId = p.userId ?? null
    if (userId) {
      saveSnapshot(userId, patched, p.snapshotStorage)
    }
    setToastMessage(toast)
  }, [])

  // ── Category A light corrections ──
  const rescheduleSession = useCallback((sessionId: string, toDay: DayOfWeek) => {
    applyCorrection(
      { id: nextCorrectionId(), type: 'reschedule', sessionId, toDay, appliedAt: new Date().toISOString(), reversible: true },
      `Séance reportée à ${DAY_LABELS[toDay]}`,
    )
  }, [applyCorrection])

  const skipSession = useCallback((sessionId: string) => {
    applyCorrection(
      { id: nextCorrectionId(), type: 'skip', sessionId, appliedAt: new Date().toISOString(), reversible: true },
      'Séance passée',
    )
  }, [applyCorrection])

  const markDayUnavailable = useCallback((day: DayOfWeek) => {
    applyCorrection(
      { id: nextCorrectionId(), type: 'unavailable_day', toDay: day, appliedAt: new Date().toISOString(), reversible: true },
      `Jour indisponible · Séance déplacée`,
    )
  }, [applyCorrection])

  // ── External change detection (Category B / C) ──
  useEffect(() => {
    if (!snapshot || !params) return

    // Use global hash to detect any event change (not just current week)
    const globalHash = computeGlobalEventsHash(params.events)
    if (globalHash === lastGlobalHashRef.current) return
    lastGlobalHashRef.current = globalHash

    // Classify the change (caller guarantees events differ from resolve-time)
    const result = classifyExternalChange(snapshot, params.events)

    const userId = params.userId ?? null

    if (result.category === 'C') {
      // Category C: confirmation required — do NOT mutate visible week
      const alreadyPending = snapshot.confirmationRequired.some(
        (c) => c.type === 'match_changed',
      )
      if (!alreadyPending) {
        const updated: WeekSnapshot = {
          ...snapshot,
          confirmationRequired: [
            ...snapshot.confirmationRequired,
            {
              id: `conf-${Date.now()}`,
              type: 'match_changed',
              message: 'Un match de cette semaine a changé.',
              cta: 'Mettre à jour mon programme',
              data: { fingerprint: result.currentFingerprint },
            },
          ],
        }
        setSnapshot(updated)
        if (userId) saveSnapshot(userId, updated, params.snapshotStorage)
      }
    } else if (result.category === 'B') {
      // Category B: queue as pending — consumed on next resolveWeek
      const updated: WeekSnapshot = {
        ...snapshot,
        pendingUpdates: [
          ...snapshot.pendingUpdates,
          {
            id: `pending-${Date.now()}`,
            source: 'ffr_sync' as const,
            description: 'Calendrier mis à jour',
            affectsCurrentWeek: false,
            data: { fingerprint: result.currentFingerprint },
            detectedAt: new Date().toISOString(),
          },
        ],
      }
      setSnapshot(updated)
      if (userId) saveSnapshot(userId, updated, params.snapshotStorage)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot?.weekId, snapshot?.eventsFingerprint, params?.events])

  // ── Undo correction ──
  const undoCorrection = useCallback((correctionId: string) => {
    const snap = snapshotRef.current
    const p = paramsRef.current
    if (!snap || !p) return
    const target = snap.corrections.find((c) => c.id === correctionId)
    if (!target || !target.reversible) return

    // F9: add_match undo requires full re-resolution with the event removed
    if (target.type === 'add_match' && target.addedEventId) {
      const eventsWithout = p.events.filter((e) => e.id !== target.addedEventId)
      const freshSurface = resolveWeeklyProgramSurface({
        ...p,
        events: eventsWithout,
      })
      const userId = p.userId ?? null
      let blockProg: BlockProgressionState | undefined
      if (freshSurface.schedulingMode === 'sequential' && userId) {
        blockProg = getBlockProgression(
          userId,
          p.today,
          freshSurface.planningContext,
          p.blockProgressionStorage,
        )
      }
      const remainingCorrections = snap.corrections.filter((c) => c.id !== correctionId)
      // Fresh resolve produces a clean snapshot (no corrections in presentation).
      // We must then rebuild with remaining corrections so reschedule/skip/etc.
      // are still reflected in the presentation layer.
      const fresh = resolveWeek({
        surface: freshSurface,
        events: eventsWithout,
        today: p.today,
        clubSchedule: p.profile.clubSchedule,
        scSchedule: p.profile.scSchedule,
        previousSnapshot: snap,
        blockProgression: blockProg,
      })
      const rebuilt = rebuildWithRemainingCorrections(fresh, remainingCorrections, {
        events: eventsWithout,
        today: p.today,
        clubSchedule: p.profile.clubSchedule,
        scSchedule: p.profile.scSchedule,
      })
      setSnapshot(rebuilt)
      if (userId) saveSnapshot(userId, rebuilt, p.snapshotStorage)
      resolvedWeekRef.current = `${userId ?? 'anon'}:${rebuilt.weekId}`
      lastGlobalHashRef.current = computeGlobalEventsHash(eventsWithout)
      setToastMessage('Match retiré · Programme mis à jour')
      return
    }

    const rebuilt = rebuildWithoutCorrection(snap, correctionId, {
      events: p.events,
      today: p.today,
      clubSchedule: p.profile.clubSchedule,
      scSchedule: p.profile.scSchedule,
    })
    setSnapshot(rebuilt)
    const userId = p.userId ?? null
    if (userId) saveSnapshot(userId, rebuilt, p.snapshotStorage)
    setToastMessage('Correction annulée')
  }, [])

  // ── Confirm pending update (Category C) ──
  const confirmUpdate = useCallback((updateId: string) => {
    const snap = snapshotRef.current
    const p = paramsRef.current
    if (!snap || !p || !upstream.surface) return

    // Remove the confirmation item
    const remaining = snap.confirmationRequired.filter((c) => c.id !== updateId)

    // Compute fresh block progression
    const userId = p.userId ?? null
    let blockProg: BlockProgressionState | undefined
    if (upstream.surface.schedulingMode === 'sequential' && userId) {
      blockProg = getBlockProgression(
        userId,
        p.today,
        upstream.surface.planningContext,
        p.blockProgressionStorage,
      )
    }

    // Full resolve with current upstream surface
    const fresh = resolveWeek({
      surface: upstream.surface,
      events: p.events,
      today: p.today,
      clubSchedule: p.profile.clubSchedule,
      scSchedule: p.profile.scSchedule,
      previousSnapshot: { ...snap, confirmationRequired: remaining },
      blockProgression: blockProg,
    })

    if (userId) saveSnapshot(userId, fresh, p.snapshotStorage)
    setSnapshot(fresh)
    resolvedWeekRef.current = `${userId ?? 'anon'}:${fresh.weekId}`
    setToastMessage('Programme mis à jour')
  }, [upstream.surface])

  // ── Heavy correction helper: full re-resolution ──
  const applyHeavyCorrection = useCallback((
    correctionType: 'fatigue' | 'add_match',
    modifiedEvents: CalendarEvent[],
    modifiedFatigue: 'OK' | 'FATIGUE',
    toast: string,
    addedEventId?: string,
    matchDate?: string,
  ) => {
    const snap = snapshotRef.current
    const p = paramsRef.current
    if (!snap || !p) return

    // Re-run the engine with modified inputs.
    // When user explicitly toggles back to OK, override acwrZone to 'optimal'
    // so resolveFatigueLevel returns 'normal' — the user is saying "I feel fine"
    // despite what the ACWR says. This prevents the programme from staying in
    // reduced mode after the toggle.
    const overrideAcwr = correctionType === 'fatigue' && modifiedFatigue === 'OK'
    const freshSurface = resolveWeeklyProgramSurface({
      ...p,
      events: modifiedEvents,
      fatigue: modifiedFatigue,
      ...(overrideAcwr ? { acwrZone: 'optimal' as const, ignoreAcwrOverload: true } : {}),
    })

    const userId = p.userId ?? null
    let blockProg: BlockProgressionState | undefined
    if (freshSurface.schedulingMode === 'sequential' && userId) {
      blockProg = getBlockProgression(
        userId,
        p.today,
        freshSurface.planningContext,
        p.blockProgressionStorage,
      )
    }

    const correction: WeekCorrection = {
      id: nextCorrectionId(),
      type: correctionType,
      appliedAt: new Date().toISOString(),
      // F9: add_match is reversible for 24h per spec; fatigue uses the toggle as reversal
      reversible: correctionType === 'add_match',
      ...(addedEventId ? { addedEventId } : {}),
      ...(matchDate ? { matchDate } : {}),
    }

    // Full resolve with fresh surface (not a light patch).
    // For fatigue corrections, drop previousSnapshot to force a complete layout
    // rebuild — otherwise the reduced-volume layout from the previous state leaks.
    const fresh = resolveWeek({
      surface: freshSurface,
      events: modifiedEvents,
      today: p.today,
      clubSchedule: p.profile.clubSchedule,
      scSchedule: p.profile.scSchedule,
      previousSnapshot: correctionType === 'fatigue' ? undefined : snap,
      blockProgression: blockProg,
    })

    // Carry over the correction into the fresh snapshot and recompute explanation.
    // For fatigue: when returning to OK, remove all fatigue corrections (clean slate).
    // When going to FATIGUE, replace any existing fatigue correction (idempotent).
    const finalCorrections = correctionType === 'fatigue'
      ? (modifiedFatigue === 'OK'
          ? snap.corrections.filter(c => c.type !== 'fatigue')
          : [...snap.corrections.filter(c => c.type !== 'fatigue'), correction])
      : [...snap.corrections, correction]
    const withCorrection: WeekSnapshot = {
      ...fresh,
      profileHash: computeProfileHash(p.profile),
      corrections: finalCorrections,
      explanation: buildExplanation({
        planningContext: freshSurface.planningContext,
        schedulingMode: freshSurface.schedulingMode,
        presentation: fresh.presentation,
        corrections: finalCorrections,
      }),
    }

    if (userId) saveSnapshot(userId, withCorrection, p.snapshotStorage)
    setSnapshot(withCorrection)
    resolvedWeekRef.current = `${userId ?? 'anon'}:${withCorrection.weekId}`
    lastGlobalHashRef.current = computeGlobalEventsHash(modifiedEvents)
    setToastMessage(toast)
  }, [])

  // ── Heavy correction: setFatigue ──
  const handleSetFatigue = useCallback((newFatigue: 'OK' | 'FATIGUE') => {
    const p = paramsRef.current
    if (!p) return
    applyHeavyCorrection(
      'fatigue',
      p.events,
      newFatigue,
      newFatigue === 'FATIGUE' ? 'Volume réduit cette semaine' : 'Volume normal',
    )
  }, [applyHeavyCorrection])

  // ── Heavy correction: addMatch ──
  // Accepts the canonical created event (returned by useCalendar.addEvent)
  // and builds the guaranteed-correct events array for the engine re-run.
  const handleAddMatch = useCallback((createdEvent: CalendarEvent) => {
    const p = paramsRef.current
    if (!p) return
    const updatedEvents = [...p.events, createdEvent].sort(
      (a, b) => a.date.localeCompare(b.date),
    )
    applyHeavyCorrection(
      'add_match',
      updatedEvents,
      p.fatigue,
      'Match ajouté · Programme mis à jour',
      createdEvent.id,
      createdEvent.date,
    )
  }, [applyHeavyCorrection])

  return {
    snapshot: activeSnapshot,
    isReady: activeSnapshot !== null,
    hasPendingUpdates: (activeSnapshot?.pendingUpdates.length ?? 0) > 0,
    hasConfirmationRequired: (activeSnapshot?.confirmationRequired.length ?? 0) > 0,
    surface: activeSnapshot?.surface ?? null,
    blockProgression: activeSnapshot?.blockProgression,
    toastMessage,
    clearToast,

    rescheduleSession,
    skipSession,
    markDayUnavailable,
    undoCorrection,
    setFatigue: handleSetFatigue,
    addMatch: handleAddMatch,
    confirmPendingUpdate: confirmUpdate,
  }
}
