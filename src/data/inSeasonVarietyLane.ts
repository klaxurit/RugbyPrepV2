/**
 * Lane de variété in-season (0–3) selon mésocycle + niveau.
 *
 * - Fondations (`starter`) : 1 lane / mésocycle (4 semaines)
 * - Performance (+ builder legacy) : 1 lane / 2 semaines
 */

export type InSeasonVarietyLane = 0 | 1 | 2 | 3

export type InSeasonVarietyTrainingLevel = 'starter' | 'builder' | 'performance'

export function inSeasonVarietyLane(params: {
  mesocycleBlock: number
  mesocycleWeek?: 1 | 2 | 3 | 4
  trainingLevel?: InSeasonVarietyTrainingLevel | null
}): InSeasonVarietyLane {
  const block =
    Number.isFinite(params.mesocycleBlock) && params.mesocycleBlock >= 1
      ? Math.floor(params.mesocycleBlock)
      : 1
  const week = params.mesocycleWeek ?? 1
  // Sans niveau (tests / appels legacy) : cadence mésocycle (= Fondations).
  const level = params.trainingLevel ?? 'starter'

  if (level === 'starter') {
    return ((block - 1) % 4) as InSeasonVarietyLane
  }

  // Performance / builder : semaines 1–2 = half 0, 3–4 = half 1 dans le bloc
  const half = week <= 2 ? 0 : 1
  return (((block - 1) * 2 + half) % 4) as InSeasonVarietyLane
}

/** A/B pour Primer / Full (2 mothers). */
export function inSeasonAbVariant(
  lane: InSeasonVarietyLane,
): 'A' | 'B' {
  return lane % 2 === 0 ? 'A' : 'B'
}
