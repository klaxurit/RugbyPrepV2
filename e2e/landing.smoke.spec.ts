import { expect, test } from '@playwright/test'

/**
 * Smoke minimal : bundle prod + hydration landing (lazy).
 * Sans variables Vite externes : évite réseaux vers Supabase/PostHog en prod build.
 */
test('accueil affiche la landing (lien Connexion)', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Connexion' }).first()).toBeVisible({
    timeout: 30_000,
  })
})
