import type { CycleWeek, SessionLog } from '../../types/training'

export const shouldRecommendDeload = (
  logs: SessionLog[],
  currentWeek: CycleWeek
): { recommend: boolean; reason?: string } => {
  if (currentWeek === 'W4') {
    return { recommend: true, reason: 'Fin du bloc FORCE (transition)' }
  }
  if (currentWeek === 'W8') {
    return { recommend: true, reason: 'Fin du cycle' }
  }

  const lastTwoLogs = logs.slice(0, 2)
  if (
    lastTwoLogs.length === 2 &&
    lastTwoLogs.every((log) => log.fatigue === 'FATIGUE')
  ) {
    return { recommend: true, reason: 'Fatigue sur 2 séances' }
  }

  return { recommend: false }
}
