export type CompleteProfileKind = 'club' | 'morpho' | 'gender'

/**
 * One contextual prompt at a time, in program-impact order.
 * Gender only when still unknown — onboarding no longer guesses male_senior.
 */
export function resolveCompleteProfileKind(input: {
  clubCode?: string | null
  heightCm?: number | null
  weightKg?: number | null
  populationSegment?: string | null
  dismissed?: Partial<Record<CompleteProfileKind, boolean>>
}): CompleteProfileKind | null {
  const dismissed = input.dismissed ?? {}

  if (!input.clubCode?.trim() && !dismissed.club) return 'club'

  const missingMorpho =
    input.heightCm == null ||
    input.heightCm <= 0 ||
    input.weightKg == null ||
    input.weightKg <= 0
  if (missingMorpho && !dismissed.morpho) return 'morpho'

  const unknownGender =
    input.populationSegment == null ||
    input.populationSegment === '' ||
    input.populationSegment === 'unknown'
  if (unknownGender && !dismissed.gender) return 'gender'

  return null
}
