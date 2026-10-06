import { expect, test } from '@playwright/test'

/**
 * Smoke minimal : bundle prod + hydration landing (lazy).
 * Sans variables Vite externes : évite réseaux vers Supabase/PostHog en prod build.
 */
test('accueil affiche la landing (lien Connexion)', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Se connecter' }).first()).toBeVisible({
    timeout: 30_000,
  })
  await expect(page.getByTestId('store-badges').first()).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Télécharger sur Google Play' }).first(),
  ).toHaveAttribute('href', /play\.google\.com\/store\/apps/)
})
