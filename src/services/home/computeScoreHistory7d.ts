import type { SessionLog } from '../../types/training'

export interface ScoreHistory7d {
  /** 7 valeurs de score (j-6 → j-0, le plus récent = j-0). */
  values: number[]
  /** Delta entre la première et la dernière valeur. */
  delta: number
}

interface ComputeInputs {
  /** Score courant (aujourd'hui) issu de useReadinessScore. Sert d'ancre. */
  currentScore: number
  /** Logs sur >= 14 derniers jours. */
  logs: readonly SessionLog[]
  todayISO: string
}

/**
 * Calcule un historique léger sur 7 jours du score de forme.
 *
 * Approximation V1 : on utilise le `currentScore` comme ancre du jour 7, puis on
 * dérive les 6 jours précédents en fonction de la densité d'activité (séances
 * loguées) et du RPE moyen des séances de chaque jour. C'est un calcul "lite"
 * destiné à alimenter la sparkline visuelle — pas un score de readiness exact
 * rétroactif (qui coûterait cher à recalculer car il dépend de l'ACWR
 * historique, du fatigue persisté par jour, etc.).
 *
 * Logique :
 *  - Pour chaque jour J-i (i de 6 à 0), on récupère les logs du jour
 *  - Si pas de log → on conserve le score précédent +/- bruit léger (régression vers la moyenne)
 *  - Si log avec RPE → +/- ajustement selon RPE (RPE bas = score haut)
 *  - On normalise pour que values[6] === currentScore (jour courant)
 */
export function computeScoreHistory7d(inputs: ComputeInputs): ScoreHistory7d {
  const { currentScore, logs, todayISO } = inputs
  const todayDate = new Date(`${todayISO}T12:00:00`)

  // Estime un score brut par jour (sans normalisation finale).
  const raw: number[] = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(todayDate)
    date.setDate(date.getDate() - i)
    const dateISO = date.toISOString().slice(0, 10)
    const dayLogs = logs.filter((l) => l.dateISO.slice(0, 10) === dateISO)

    let dayScore: number
    if (dayLogs.length === 0) {
      const prev = raw.length > 0 ? raw[raw.length - 1] : currentScore
      // Régression douce vers 70 (équilibre théorique) sans data du jour.
      dayScore = prev + (70 - prev) * 0.15
    } else {
      const rpes = dayLogs
        .map((l) => l.rpe)
        .filter((rpe): rpe is number => typeof rpe === 'number')
      const avgRpe = rpes.length > 0 ? rpes.reduce((s, x) => s + x, 0) / rpes.length : 5
      // RPE 1 = 90, RPE 5 = 70, RPE 8 = 45, RPE 10 = 30
      dayScore = Math.max(20, Math.min(100, 100 - avgRpe * 7))
    }
    raw.push(dayScore)
  }

  // Normalise pour que le dernier point soit exactement le currentScore
  // (cohérence visuelle avec la jauge).
  const lastRaw = raw[raw.length - 1]
  const adjustment = currentScore - lastRaw
  const values = raw.map((v) => Math.max(15, Math.min(100, Math.round(v + adjustment))))

  const delta = values[values.length - 1] - values[0]
  return { values, delta }
}
