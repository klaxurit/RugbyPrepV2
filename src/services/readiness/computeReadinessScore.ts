import type { ACWRZone } from '../../hooks/useACWR'

export interface ReadinessInput {
  acwrZone: ACWRZone | null
  fatigue: 'OK' | 'FATIGUE'
  lastSessionDateISO: string | null
  nextMatchDateISO: string | null
  todayISO: string
}

export interface ReadinessComponent {
  score: number
  weight: number
}

export interface ReadinessResult {
  score: number
  label: string
  color: 'emerald' | 'green' | 'amber' | 'red'
  components: {
    acwr: ReadinessComponent | null
    fatigue: ReadinessComponent
    recovery: ReadinessComponent | null
    matchProximity: ReadinessComponent | null
  }
  hasSufficientData: boolean
}

const ACWR_SCORES: Record<ACWRZone, number> = {
  optimal: 100,
  underload: 40,
  caution: 70,
  danger: 40,
  critical: 10,
}

function diffDays(fromISO: string, toISO: string): number {
  const a = new Date(`${fromISO.slice(0, 10)}T12:00:00`)
  const b = new Date(`${toISO.slice(0, 10)}T12:00:00`)
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

/**
 * Fraîcheur / récupération depuis la dernière séance de muscu (hors récup active).
 * Pic à J+2, puis décroissance si inactivité prolongée (désadaptation).
 * Seuils documentés dans `src/knowledge/evidence-register.md` (niveau D).
 */
export function recoveryScoreFromDaysSinceSession(daysSinceLastSession: number): number {
  if (daysSinceLastSession <= 0) return 50
  if (daysSinceLastSession === 1) return 75
  if (daysSinceLastSession === 2) return 100
  if (daysSinceLastSession === 3) return 90
  if (daysSinceLastSession === 4) return 80
  if (daysSinceLastSession === 5) return 70
  if (daysSinceLastSession === 6) return 50
  if (daysSinceLastSession === 7) return 45
  if (daysSinceLastSession <= 10) return 40
  if (daysSinceLastSession <= 14) return 30
  return 20
}

function matchProximityScore(daysUntilMatch: number): number {
  if (daysUntilMatch <= 0) return 50
  if (daysUntilMatch === 1) return 70
  if (daysUntilMatch === 2) return 90
  return 100
}

function labelAndColor(score: number): { label: string; color: ReadinessResult['color'] } {
  if (score >= 80) return { label: 'Excellente forme', color: 'emerald' }
  if (score >= 65) return { label: 'Bonne forme', color: 'green' }
  if (score >= 40) return { label: 'Attention', color: 'amber' }
  return { label: 'Repos conseillé', color: 'red' }
}

export function computeReadinessScore(input: ReadinessInput): ReadinessResult {
  const { acwrZone, fatigue, lastSessionDateISO, nextMatchDateISO, todayISO } = input

  // Build weighted components — skip those without data
  const raw: { key: string; score: number; baseWeight: number }[] = []

  if (acwrZone != null) {
    raw.push({ key: 'acwr', score: ACWR_SCORES[acwrZone], baseWeight: 0.4 })
  }

  raw.push({ key: 'fatigue', score: fatigue === 'OK' ? 100 : 40, baseWeight: 0.2 })

  if (lastSessionDateISO != null) {
    const days = diffDays(lastSessionDateISO, todayISO)
    raw.push({ key: 'recovery', score: recoveryScoreFromDaysSinceSession(days), baseWeight: 0.2 })
  }

  if (nextMatchDateISO != null) {
    const days = diffDays(todayISO, nextMatchDateISO)
    raw.push({ key: 'matchProximity', score: matchProximityScore(days), baseWeight: 0.2 })
  }

  // Normalize weights to sum to 1
  const totalWeight = raw.reduce((s, c) => s + c.baseWeight, 0)
  const weighted = raw.map((c) => ({
    ...c,
    weight: c.baseWeight / totalWeight,
  }))

  const score = Math.round(
    weighted.reduce((s, c) => s + c.score * c.weight, 0),
  )

  const find = (key: string): ReadinessComponent | null => {
    const c = weighted.find((w) => w.key === key)
    return c ? { score: c.score, weight: Math.round(c.weight * 100) } : null
  }

  const { label, color } = labelAndColor(score)
  const hasSufficientData = acwrZone != null || lastSessionDateISO != null

  return {
    score,
    label,
    color,
    components: {
      acwr: find('acwr'),
      fatigue: find('fatigue')!,
      recovery: find('recovery'),
      matchProximity: find('matchProximity'),
    },
    hasSufficientData,
  }
}
