import { useEffect } from 'react'
import {
  DEFAULT_PROGRAM_EVOLUTION_BULLETS,
} from '../components/program/ProgramEvolutionSheet'
import { useProgramEvolutionSheet } from '../contexts/ProgramEvolutionSheetContext'
import type { ConfirmationRequired } from '../types/scheduling'
import type { CalendarEvent } from '../types/training'

/** Évite une double ouverture quand Week + Home (ou autre) montent le même snapshot. */
let lastOpenedConfirmationId: string | null = null

/** Tests uniquement — réinitialise la dédup entre cas. */
export function resetWeekSnapshotConfirmationDedupForTests(): void {
  lastOpenedConfirmationId = null
}

const DEFAULT_PROGRAM_EVOLUTION_BULLETS_FALLBACK = [...DEFAULT_PROGRAM_EVOLUTION_BULLETS]

const SECTION_TITLE: Record<ConfirmationRequired['type'], string> = {
  match_changed: 'Semaine de match',
  season_ended: 'Fin de saison',
  playoffs_suggested: 'Play-offs',
}

/**
 * Ouvre {@link ProgramEvolutionSheet} pour la première entrée `confirmationRequired`
 * (Cat. C), avec CTA qui appelle `confirmPendingUpdate` — même surface que les notices match.
 */
export function useWeekSnapshotConfirmationSheet(args: {
  hasConfirmationRequired: boolean
  confirmationItem: ConfirmationRequired | null
  confirmPendingUpdate: (id: string) => void
  visibleEvents: CalendarEvent[]
  today: string
}): void {
  const { openProgramEvolution } = useProgramEvolutionSheet()
  const { hasConfirmationRequired, confirmationItem, confirmPendingUpdate, visibleEvents, today } =
    args

  useEffect(() => {
    if (!hasConfirmationRequired) {
      lastOpenedConfirmationId = null
      return
    }
    const item = confirmationItem
    if (!item) return
    if (lastOpenedConfirmationId === item.id) return
    lastOpenedConfirmationId = item.id

    const nextMatch = visibleEvents
      .filter((e) => e.type === 'match' && e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))[0]
    const matchDateISO = nextMatch?.date

    openProgramEvolution({
      matchDateISO,
      sectionTitle: SECTION_TITLE[item.type],
      summary: item.message,
      bullets: item.type === 'match_changed' ? undefined : DEFAULT_PROGRAM_EVOLUTION_BULLETS_FALLBACK,
      primaryCtaLabel: item.cta,
      programNoticeId: matchDateISO ? `match:${matchDateISO}` : null,
      primaryAction: () => {
        confirmPendingUpdate(item.id)
      },
    })
  }, [
    hasConfirmationRequired,
    confirmationItem,
    confirmPendingUpdate,
    openProgramEvolution,
    visibleEvents,
    today,
  ])
}
