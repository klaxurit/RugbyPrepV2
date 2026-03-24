import type { SCSchedule, ClubSchedule } from '../../types/training'
import { mapSlotsToScheduleDays, type DayPreference } from './mapSlotsToScheduleDays'

/**
 * Determines which session (if any) is scheduled for today.
 *
 * Rule: compare today's day-of-week (0=Sun…6=Sat) against the real
 * day mappings from `mapSlotsToScheduleDays`. If exactly one slot
 * maps to today, return its index. If multiple slots map to today
 * (edge case), return the first one (lowest index = earliest in plan).
 * If none, return null.
 */
export function getTodaySessionIndex(
  slots: Array<{ dayPreference?: DayPreference }>,
  scSchedule?: SCSchedule,
  clubSchedule?: ClubSchedule,
  todayDow?: number, // injectable for testing; defaults to new Date().getDay()
): number | null {
  if (slots.length === 0) return null

  const dow = todayDow ?? new Date().getDay()
  const dayMappings = mapSlotsToScheduleDays(slots, scSchedule, clubSchedule?.matchDay)

  for (let i = 0; i < dayMappings.length; i++) {
    if (dayMappings[i].dayNumber === dow) return i
  }

  return null
}
