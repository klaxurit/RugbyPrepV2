import type { ProgramEvolutionAfterManualMatchPlan } from './planProgramEvolutionAfterManualMatch'

/**
 * File séquentielle match manuel : « Type de match » puis éventuellement
 * « Ton programme évolue ». La 2e ne s’ouvre que quand la 1re est fermée.
 */
export function shouldDeferProgramEvolutionForMatchKind(
  matchKindSheetOpen: boolean,
): boolean {
  return matchKindSheetOpen
}

export function resolveProgramEvolutionOpenAfterMatchKind(input: {
  matchKindSheetOpen: boolean
  plan: ProgramEvolutionAfterManualMatchPlan
}): { open: boolean; matchDateISO?: string } {
  if (shouldDeferProgramEvolutionForMatchKind(input.matchKindSheetOpen)) {
    return { open: false }
  }
  if (input.plan.action !== 'open_sheet') return { open: false }
  return { open: true, matchDateISO: input.plan.matchDateISO }
}
