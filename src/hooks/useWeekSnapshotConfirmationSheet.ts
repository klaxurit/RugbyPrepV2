import { useEffect } from 'react'
import { useProgramEvolutionSheet } from './useProgramEvolutionSheet'
import type { Lang } from '../i18n/appLabels'
import {
  defaultProgramEvolutionBullets,
  programEvolutionSectionTitle,
} from '../i18n/programSurfaces'
import type { ConfirmationRequired } from '../types/scheduling'
import type { CalendarEvent } from '../types/training'

/** Évite une double ouverture quand Week + Home (ou autre) montent le même snapshot. */
let lastOpenedConfirmationId: string | null = null

/** Tests uniquement — réinitialise la dédup entre cas. */
export function resetWeekSnapshotConfirmationDedupForTests(): void {
  lastOpenedConfirmationId = null
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
  lang?: Lang
}): void {
  const { openProgramEvolution } = useProgramEvolutionSheet()
  const {
    hasConfirmationRequired,
    confirmationItem,
    confirmPendingUpdate,
    visibleEvents,
    today,
    lang = 'fr',
  } = args

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
      sectionTitle: programEvolutionSectionTitle(item.type, lang),
      summary: item.message,
      bullets: item.type === 'match_changed' ? undefined : defaultProgramEvolutionBullets(lang),
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
    lang,
  ])
}
