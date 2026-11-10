/**
 * Source unique EMOM : dérive l’état UI depuis elapsed + durée planifiée.
 * idle → running → paused → finished (pas de 2e compteur Minute 1/N côté page).
 */

export type EmomTimerStatus = 'idle' | 'running' | 'paused' | 'completed'

export type EmomTimerView = {
  status: EmomTimerStatus
  /** Minute courante 1-based pour l’UI (« Minute 3/8 »). */
  displayMinute: number
  totalMinutes: number
  remainingInIntervalSec: number
  emomFinished: boolean
  /** Index 0-based (persist / dots). */
  currentMinuteIndex: number
  elapsedSec: number
}

export function emomPersistKey(blockNumber: number): string {
  return `emom-block-${blockNumber}`
}

/**
 * Pure. `elapsedSec` = temps actif hors pauses (horodatage de départ).
 */
export function deriveEmomTimerView(input: {
  elapsedSec: number
  totalMinutes: number
  intervalSeconds: number
  status: EmomTimerStatus
}): EmomTimerView {
  const totalMinutes = Math.max(0, input.totalMinutes)
  const interval = Math.max(1, input.intervalSeconds)
  const plannedTotal = totalMinutes * interval
  const elapsedSec = Math.max(0, input.elapsedSec)
  const emomFinished =
    input.status === 'completed' || (plannedTotal > 0 && elapsedSec >= plannedTotal)

  if (totalMinutes === 0) {
    return {
      status: input.status,
      displayMinute: 0,
      totalMinutes: 0,
      remainingInIntervalSec: 0,
      emomFinished: false,
      currentMinuteIndex: 0,
      elapsedSec,
    }
  }

  if (emomFinished) {
    return {
      status: input.status === 'completed' ? 'completed' : input.status,
      displayMinute: totalMinutes,
      totalMinutes,
      remainingInIntervalSec: 0,
      emomFinished: true,
      currentMinuteIndex: Math.max(0, totalMinutes - 1),
      elapsedSec: Math.min(elapsedSec, plannedTotal),
    }
  }

  const capped = Math.min(elapsedSec, plannedTotal)
  const currentMinuteIndex = Math.min(totalMinutes - 1, Math.floor(capped / interval))
  const intoInterval = capped % interval
  const remainingInIntervalSec = intoInterval === 0 ? interval : interval - intoInterval

  return {
    status: input.status,
    displayMinute: currentMinuteIndex + 1,
    totalMinutes,
    remainingInIntervalSec,
    emomFinished: false,
    currentMinuteIndex,
    elapsedSec: capped,
  }
}
