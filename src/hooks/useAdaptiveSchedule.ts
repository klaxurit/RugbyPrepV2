/**
 * Recalcule dynamiquement le scSchedule quand les matchs de la semaine
 * ne tombent pas sur le matchDay habituel du profil.
 *
 * Cas typique : match avancé au vendredi, ou décalé au dimanche.
 * Le schedule S&C doit s'adapter pour maintenir les espacements.
 *
 * N'écrit PAS dans le profil — retourne un scSchedule éphémère pour la semaine.
 */
import { useMemo } from 'react'
import type { CalendarEvent, ClubSchedule, DayOfWeek, SCSchedule, UserProfile } from '../types/training'
import { computeSCSchedule } from '../services/program/scheduleOptimizer'

export function useAdaptiveSchedule(
  profile: UserProfile,
  events: CalendarEvent[],
): SCSchedule | undefined {
  return useMemo(() => {
    const { clubSchedule, scSchedule, weeklySessions } = profile
    // No club schedule → nothing to adapt
    if (!clubSchedule || !scSchedule) return scSchedule

    // Find upcoming match dates in the next 10 days
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const horizon = new Date(today)
    horizon.setDate(horizon.getDate() + 10)

    const upcomingMatchDates = events
      .filter((e) => {
        if (e.type !== 'match' || e.user_hidden) return false
        const d = new Date(e.date + 'T12:00:00')
        return d >= today && d <= horizon
      })
      .map((e) => e.date)

    if (upcomingMatchDates.length === 0) return scSchedule

    // Check if any upcoming match falls on a different day than the usual matchDay
    const usualMatchDay = clubSchedule.matchDay
    const hasUnusualMatchDay = upcomingMatchDates.some((dateStr) => {
      const dow = new Date(dateStr + 'T12:00:00').getDay() as DayOfWeek
      return usualMatchDay !== undefined && dow !== usualMatchDay
    })

    if (!hasUnusualMatchDay) return scSchedule

    // Recompute with actual upcoming match dates
    const freq = (weeklySessions === 3 ? 3 : 2) as 2 | 3
    return computeSCSchedule(clubSchedule, freq, upcomingMatchDates)
  }, [profile, events])
}
