export type AdminAnchorFormInput = {
  seasonEndedAt: string
  offSeasonStartAt: string
  returnToTeamTrainingAt: string
  onboardingCycleHint: string
  manualCycleOverride: string
  manualOffSeasonWeekOverride: string
  manualPreSeasonWeekOverride: string
  seasonEndedSource: string
  skipOffSeasonRecoveryIntro: boolean
  manualPlayoffs: boolean
}

export function formToAnchorsForSave(form: AdminAnchorFormInput): Record<string, unknown> {
  const out: Record<string, unknown> = {}

  if (form.seasonEndedAt.trim()) out.seasonEndedAt = form.seasonEndedAt.trim()
  else out.seasonEndedAt = null

  if (form.offSeasonStartAt.trim()) out.offSeasonStartAt = form.offSeasonStartAt.trim()
  else out.offSeasonStartAt = null

  if (form.returnToTeamTrainingAt.trim()) out.returnToTeamTrainingAt = form.returnToTeamTrainingAt.trim()
  else out.returnToTeamTrainingAt = null

  if (form.onboardingCycleHint) out.onboardingCycleHint = form.onboardingCycleHint
  else out.onboardingCycleHint = null

  if (form.manualCycleOverride) out.manualCycleOverride = form.manualCycleOverride
  else out.manualCycleOverride = null

  if (form.manualOffSeasonWeekOverride.trim()) {
    out.manualOffSeasonWeekOverride = Number(form.manualOffSeasonWeekOverride)
  } else {
    out.manualOffSeasonWeekOverride = null
  }

  if (form.manualPreSeasonWeekOverride.trim()) {
    out.manualPreSeasonWeekOverride = Number(form.manualPreSeasonWeekOverride)
  } else {
    out.manualPreSeasonWeekOverride = null
  }

  if (form.seasonEndedSource) out.seasonEndedSource = form.seasonEndedSource
  else out.seasonEndedSource = null

  out.skipOffSeasonRecoveryIntro = form.skipOffSeasonRecoveryIntro ? true : null
  out.manualPlayoffs = form.manualPlayoffs ? true : null

  return out
}

/**
 * Fusionne le JSON brut avec les champs du formulaire.
 * Les champs du formulaire priment toujours (le JSON ne doit pas écraser une semaine modifiée).
 */
export function buildPlanningAnchorsPatch(
  form: AdminAnchorFormInput,
  anchorsJson: string
): Record<string, unknown> {
  let base: Record<string, unknown> = {}
  const trimmed = anchorsJson.trim()
  if (trimmed && trimmed !== '{}') {
    const parsed: unknown = JSON.parse(trimmed)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('JSON ancres invalide')
    }
    base = { ...(parsed as Record<string, unknown>) }
  }

  const fromForm = formToAnchorsForSave(form)
  const merged: Record<string, unknown> = { ...base }

  for (const [key, value] of Object.entries(fromForm)) {
    if (value === null) delete merged[key]
    else merged[key] = value
  }

  return merged
}
