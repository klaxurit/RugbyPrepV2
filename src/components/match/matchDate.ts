/**
 * Helpers date partagés pour les cartes match.
 * Volontairement identiques aux versions historiques de CalendarPage pour
 * garantir un rendu pixel-equivalent.
 */

export function formatDateFR(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

/** Version courte : "sam. 21 avr." */
export function formatDateFRShort(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function diffDays(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Prochain samedi utile pour pré-remplir l’ajout manuel — même logique que l’ancien
 * formulaire inline « J’ai un match cette semaine » (WeekPage).
 */
export function suggestedMatchSaturdayISO(todayISO: string): string {
  const d = new Date(todayISO + 'T12:00:00')
  const dow = d.getDay()
  const add = ((6 - dow + 7) % 7 || 7)
  d.setDate(d.getDate() + add)
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}
