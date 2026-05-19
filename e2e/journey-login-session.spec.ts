import { expect, test } from '@playwright/test'
import { dismissCookieBannerIfPresent } from './helpers/cookies'
import { completeOnboardingWizard, loginWithPassword } from './helpers/authFlow'

function e2eCredentials(): { email: string; password: string } | null {
  const email = process.env.E2E_TEST_EMAIL?.trim()
  const password = process.env.E2E_TEST_PASSWORD?.trim()
  if (!email || !password) return null
  return { email, password }
}

test.describe('Parcours authentifié (staging)', () => {
  test('connexion → (onboarding si besoin) → fiche séance /session/0', async ({ page }) => {
    const creds = e2eCredentials()
    test.skip(!creds, 'Définir E2E_TEST_EMAIL et E2E_TEST_PASSWORD (compte Supabase staging, email confirmé).')

    await page.goto('/')
    await dismissCookieBannerIfPresent(page)

    await loginWithPassword(page, creds!.email, creds!.password)

    if (/\/onboarding/i.test(page.url())) {
      await completeOnboardingWizard(page)
    }

    await page.goto('/session/0')

    await expect(
      page.locator('[data-testid="mother-session-detail"], [data-testid="session-not-found"]').first(),
    ).toBeVisible({ timeout: 35_000 })
  })
})
