/**
 * Frise semaine (héros match) — Claude Design Carte B.
 * Données connues seulement : jour de séance = Salle, jour de match = Match.
 * Les autres jours = Repos (aucune séance Club inventée).
 */
import type { Lang } from '../../i18n/appLabels'

export type ShareWeekDayKind = 'salle' | 'match' | 'repos'

export interface ShareWeekDay {
  dayLabel: string
  dayNumber: number
  kind: ShareWeekDayKind
  isToday: boolean
}

const DAY_LABELS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'] as const
const DAY_LABELS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

function parseUtcDay(isoDate: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate.trim())
  if (!m) return null
  const day = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  return Number.isNaN(day.getTime()) ? null : day
}

function isoKey(day: Date): string {
  return day.toISOString().slice(0, 10)
}

/**
 * 7 jours se terminant le jour du match (J − 6 … match).
 * `sessionDateISO` = jour de la séance partagée ; `daysUntil` = J-X du match.
 */
export function buildShareWeekStrip(
  sessionDateISO: string | null | undefined,
  daysUntil: number,
  lang: Lang,
): ShareWeekDay[] | null {
  if (!sessionDateISO || daysUntil < 1 || daysUntil > 7) return null
  const today = parseUtcDay(sessionDateISO)
  if (!today) return null

  const match = new Date(today.getTime())
  match.setUTCDate(match.getUTCDate() + daysUntil)
  const todayKey = isoKey(today)
  const matchKey = isoKey(match)
  const labels = lang === 'en' ? DAY_LABELS_EN : DAY_LABELS_FR

  const days: ShareWeekDay[] = []
  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(match.getTime())
    day.setUTCDate(day.getUTCDate() - offset)
    const key = isoKey(day)
    const isToday = key === todayKey
    const isMatch = key === matchKey
    let kind: ShareWeekDayKind = 'repos'
    if (isMatch) kind = 'match'
    else if (isToday) kind = 'salle'
    days.push({
      dayLabel: labels[day.getUTCDay()]!,
      dayNumber: day.getUTCDate(),
      kind,
      isToday,
    })
  }
  return days
}
