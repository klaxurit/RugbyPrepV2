import type { SessionLog } from '../../types/training'

export interface StreakResult {
  /** Jours avec au moins une séance loguée sur les 14 derniers jours. */
  count: number
  /**
   * 14 derniers points (du plus ancien au plus récent) :
   * `true` si une séance a été loguée ce jour-là, `false` sinon.
   * Sert à dessiner la mini-barre semaine/quinzaine du StreakCard.
   */
  weekHistory: boolean[]
  /**
   * Phrase courte (FR) à afficher en italic Playfair sous le compteur.
   * Adaptée à la récence : relance si pause prolongée, encouragement si actif.
   */
  caption: string
}

const HISTORY_WINDOW = 14
/** Au-delà de ce délai sans séance, on affiche un message de relance. */
const DORMANT_DAYS = 7

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function diffDaysISO(fromISO: string, toISO: string): number {
  const from = new Date(`${fromISO.slice(0, 10)}T12:00:00`).getTime()
  const to = new Date(`${toISO.slice(0, 10)}T12:00:00`).getTime()
  return Math.round((to - from) / 86_400_000)
}

function daysSinceLastSession(logs: readonly SessionLog[], todayISO: string): number | null {
  const last = [...logs].sort((a, b) => b.dateISO.localeCompare(a.dateISO))[0]
  if (!last) return null
  return diffDaysISO(last.dateISO, todayISO)
}

/**
 * Compte les séances récentes (14 j) et bâtit l'array des 14 derniers jours
 * pour le visuel "mini-barres" du StreakCard.
 *
 * Ne distingue pas les types de séance : toute SessionLog compte (gym,
 * récup active, etc.). Cette définition est volontairement permissive
 * pour récompenser la régularité plutôt que l'intensité.
 */
export function computeStreak(logs: readonly SessionLog[], todayISO: string): StreakResult {
  const today = new Date(`${todayISO}T12:00:00`)

  const loggedDays = new Set<string>()
  const cutoff = new Date(today)
  cutoff.setDate(cutoff.getDate() - HISTORY_WINDOW)

  for (const log of logs) {
    const dateOnly = log.dateISO.slice(0, 10)
    const logDate = new Date(`${dateOnly}T12:00:00`)
    if (logDate >= cutoff && logDate <= today) {
      loggedDays.add(dateOnly)
    }
  }
  const count = loggedDays.size

  const weekHistory: boolean[] = []
  for (let i = HISTORY_WINDOW - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    weekHistory.push(loggedDays.has(ymd(d)))
  }

  const daysSince = daysSinceLastSession(logs, todayISO)
  const hasEverLogged = logs.length > 0

  let caption: string
  if (!hasEverLogged) {
    caption = 'Lance ta première séance.'
  } else if (daysSince != null && daysSince >= DORMANT_DAYS) {
    caption =
      daysSince >= 14
        ? 'Ça fait un moment — reprends par une séance courte.'
        : 'La cadence s’est arrêtée — remets-toi en route.'
  } else if (count === 0) {
    caption = 'Lance ta première séance.'
  } else if (count < 4) {
    caption = 'Le rythme commence.'
  } else if (count < 10) {
    caption = 'Tu installes la régularité.'
  } else if (count < 20) {
    caption = 'Tu tiens la cadence.'
  } else {
    caption = 'Discipline impressionnante.'
  }

  return { count, weekHistory, caption }
}
