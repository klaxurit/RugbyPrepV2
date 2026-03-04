import type { CycleWeek, SessionLog } from '../../types/training'

export const shouldRecommendDeload = (
  logs: SessionLog[],
  currentWeek: CycleWeek,
  acwr?: number | null
): { recommend: boolean; reason?: string; acwrTriggered?: boolean } => {
  if (currentWeek === 'H4') {
    return { recommend: true, reason: 'Fin du bloc Hypertrophie (transition vers Force)' }
  }
  if (currentWeek === 'W4') {
    return { recommend: true, reason: 'Fin du bloc Force (transition)' }
  }
  if (currentWeek === 'W8') {
    return { recommend: true, reason: 'Fin du cycle complet' }
  }

  const lastTwoLogs = logs.slice(0, 2)
  if (
    lastTwoLogs.length === 2 &&
    lastTwoLogs.every((log) => log.fatigue === 'FATIGUE')
  ) {
    return { recommend: true, reason: 'Fatigue sur 2 séances' }
  }

  if (acwr != null && acwr >= 1.5) {
    return {
      recommend: true,
      reason: `ACWR ${acwr.toFixed(2)} — surcharge détectée`,
      acwrTriggered: true,
    }
  }

  return { recommend: false }
}
