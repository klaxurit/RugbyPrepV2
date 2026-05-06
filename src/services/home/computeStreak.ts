import type { SessionLog } from '../../types/training'

export interface StreakResult {
  /** Nombre total de séances loguées (toutes catégories confondues) sur les 60 derniers jours. */
  count: number
  /**
   * 14 derniers points (du plus ancien au plus récent) :
   * `true` si une séance a été loguée ce jour-là, `false` sinon.
   * Sert à dessiner la mini-barre semaine/quinzaine du StreakCard.
   */
  weekHistory: boolean[]
  /**
   * Phrase courte (FR) à afficher en italic Playfair sous le compteur.
   * Adaptée au volume : silence motivant si 0, encouragement si peu, satisfaction si soutenu.
   */
  caption: string
}

const HISTORY_WINDOW = 14
const COUNT_WINDOW = 60

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/**
 * Compte les séances réalisées dans une fenêtre récente et bâtit l'array
 * des 14 derniers jours pour le visuel "mini-barres" du StreakCard.
 *
 * Ne distingue pas les types de séance : toute SessionLog compte (gym,
 * récup active, etc.). Cette définition est volontairement permissive
 * pour récompenser la régularité plutôt que l'intensité.
 */
export function computeStreak(logs: readonly SessionLog[], todayISO: string): StreakResult {
  const today = new Date(`${todayISO}T12:00:00`)

  // Build set of YYYY-MM-DD that contain at least one log.
  // On compte les JOURS distincts (pas chaque log) — garde-fou défensif :
  // si un jour avait deux SessionLog créés (cas legacy d'un slotSignature qui
  // changeait selon la date d'ouverture), la cadence ne double-compte pas.
  const loggedDays = new Set<string>()
  const cutoff = new Date(today)
  cutoff.setDate(cutoff.getDate() - COUNT_WINDOW)

  for (const log of logs) {
    const dateOnly = log.dateISO.slice(0, 10)
    const logDate = new Date(`${dateOnly}T12:00:00`)
    if (logDate >= cutoff && logDate <= today) {
      loggedDays.add(dateOnly)
    }
  }
  const count = loggedDays.size

  // 14-day boolean array, oldest → newest.
  const weekHistory: boolean[] = []
  for (let i = HISTORY_WINDOW - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    weekHistory.push(loggedDays.has(ymd(d)))
  }

  let caption: string
  if (count === 0) {
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
