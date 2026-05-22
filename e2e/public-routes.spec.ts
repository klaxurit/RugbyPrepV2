import { expect, test } from '@playwright/test'
import { dismissCookieBannerIfPresent } from './helpers/cookies'

test.describe('Routes publiques', () => {
  test('/auth/login — formulaire', async ({ page }) => {
    await page.goto('/auth/login')
    await dismissCookieBannerIfPresent(page)
    await expect(page.getByLabel('Email', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Mot de passe', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible()
    await expect(page.getByRole('link', { name: /Créer un compte/i })).toBeVisible()
  })

  test('/auth/signup — formulaire', async ({ page }) => {
    await page.goto('/auth/signup')
    await dismissCookieBannerIfPresent(page)
    await expect(page.getByLabel('Email', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Prénom')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Créer mon compte' })).toBeVisible()
  })

  test('/legal — CGU visibles', async ({ page }) => {
    await page.goto('/legal')
    await expect(page.getByText('Avertissement important')).toBeVisible()
  })

  test('/privacy — politique crawlable', async ({ page }) => {
    await page.goto('/privacy/')
    await expect(page.getByRole('heading', { name: 'Politique de confidentialité' })).toBeVisible()
    await expect(page.getByText('Durée de conservation des données')).toBeVisible()
    await expect(page.getByText('Suppression de vos données')).toBeVisible()
  })
})
