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
 * Prochaine occurrence du jour de match pour pré-remplir l’ajout manuel.
 * Amateur FFR : défaut **dimanche** (0). Le jour habituel club prime s’il est posé.
 * N’invente pas un event — c’est seulement la date proposée dans le formulaire.
 */
export function suggestedNextMatchISO(
  todayISO: string,
  habitualMatchDay: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 0,
): string {
  const d = new Date(todayISO + 'T12:00:00')
  const dow = d.getDay()
  const add = ((habitualMatchDay - dow + 7) % 7 || 7)
  d.setDate(d.getDate() + add)
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}
