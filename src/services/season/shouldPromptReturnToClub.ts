import type { AnnualCycle } from '../../types/annualPlanning'

export const RETURN_TO_CLUB_PROMPT_HINT_ID = 'return_to_club_prompt_v1'

export const SUPPRESS_RETURN_PROMPT_PATHS = new Set([
  '/onboarding',
  '/auth/login',
  '/auth/signup',
  '/auth/callback',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/login',
  '/signup',
  '/landing',
  '/legal',
  '/privacy',
  '/delete-account',
])

/**
 * Affiche la pop-up récurrente tant que la date de reprise club n'est pas renseignée
 * pendant l'inter-saison (ancrage pré-saison 8 sem. avant reprise).
 */
export function shouldPromptReturnToClub(input: {
  cycle: AnnualCycle | null | undefined
  hasReturnDate: boolean
  onboardingComplete: boolean
  inOnboardingGracePeriod: boolean
  hasPendingOffseasonMatch: boolean
  pathname: string
}): boolean {
  if (!input.onboardingComplete) return false
  if (input.inOnboardingGracePeriod) return false
  if (SUPPRESS_RETURN_PROMPT_PATHS.has(input.pathname)) return false
  if (input.hasReturnDate) return false
  if (input.hasPendingOffseasonMatch) return false
  return input.cycle === 'off_season'
}
