import type { ReactNode } from 'react'
import { CalendarContext } from './calendarContextValue'
import { useCalendarSource } from '../hooks/useCalendar'

/**
 * Provider qui appelle `useCalendarSource()` UNE SEULE FOIS et expose
 * le state via context. Avant l'introduction de ce provider, chaque
 * appel à `useCalendar()` créait une copie indépendante du state →
 * mutations dans MatchEditDrawer ne propagaient pas vers HomePage /
 * WeekPage. Ce bug est ce qui faisait que "Supprimer ce match" était
 * sans effet visible côté UI.
 *
 * Monter `<CalendarProvider>` après `<AuthProvider>` (le hook source
 * lit `useAuth()`) et avant tout autre code qui appelle `useCalendar`.
 */
export function CalendarProvider({ children }: { children: ReactNode }) {
  const value = useCalendarSource()
  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>
}
