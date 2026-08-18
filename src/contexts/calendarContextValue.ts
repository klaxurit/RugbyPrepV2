import { createContext, useContext } from 'react'
import type { useCalendarSource } from '../hooks/useCalendar'

/** Inferred from the source hook — keeps a single source of truth. */
export type CalendarContextValue = ReturnType<typeof useCalendarSource>

/**
 * Default no-op value — returned by `useCalendar()` quand le composant
 * est rendu hors de `CalendarProvider`. Évite de casser les tests
 * d'intégration qui rendent une page directement sans réinstancier
 * tout le tree d'app. En prod, le provider est toujours monté
 * (App.tsx) donc cette valeur n'est jamais utilisée — c'est un filet
 * de sécurité explicite, pas un fallback silencieux qui masquerait
 * un bug.
 */
const EMPTY_CALENDAR: CalendarContextValue = {
  events: [],
  visibleEvents: [],
  structuralEvents: [],
  nextMatch: null,
  nextStructuralMatch: null,
  isMatchDay: false,
  thisWeekEvents: [],
  addEvent: async () => undefined,
  removeEvent: async () => undefined,
  clearFfrImportedEvents: async () => undefined,
  updateMatchKind: async () => undefined,
  updateMatchLoad: async () => undefined,
  setMatchNeutral: async () => undefined,
  hideImportedEvent: async () => undefined,
  unhideImportedEvent: async () => undefined,
  overrideImportedEvent: async () => undefined,
  refreshFromFFR: async () => ({ imported: 0 }),
  hiddenCount: 0,
  ffrCount: 0,
  manualCount: 0,
  loading: false,
  error: null,
}

export const CalendarContext = createContext<CalendarContextValue | null>(null)

/**
 * Hook public — consomme le state calendrier partagé fourni par
 * `CalendarProvider`. Toutes les mutations (addEvent, removeEvent,
 * hideImportedEvent, etc.) propagent immédiatement vers tous les
 * consommateurs (timeline, drawer, profile, etc.).
 *
 * Tombe sur `EMPTY_CALENDAR` quand utilisé hors provider — pratique
 * pour les tests d'intégration qui rendent une page sans wrapper.
 */
export function useCalendar(): CalendarContextValue {
  const ctx = useContext(CalendarContext)
  return ctx ?? EMPTY_CALENDAR
}
