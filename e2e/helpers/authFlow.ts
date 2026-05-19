import { expect, type Page } from '@playwright/test'

export async function loginWithPassword(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/auth/login')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Mot de passe', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await page.waitForURL(/\/(onboarding|program|home|week)(\/|$)/, { timeout: 45_000 })
  await expect(page).not.toHaveURL(/\/auth\/login/)
}

/** Parcours onboarding FR minimal (position → résumé → fin). */
export async function completeOnboardingWizard(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/onboarding/)

  await page.getByRole('button', { name: /Première ligne/i }).click()
  await page.getByRole('button', { name: 'Suivant' }).first().click()

  await page.getByRole('button', { name: 'Fondations' }).click()
  await page.getByRole('button', { name: '2 séances' }).click()
  await page.getByRole('button', { name: 'Suivant' }).first().click()

  await page.getByRole('button', { name: 'En saison' }).click()
  await page.getByRole('button', { name: /Je reprends/i }).click()
  await page.getByRole('button', { name: 'Suivant' }).first().click()

  await page.getByRole('button', { name: 'Suivant' }).first().click()

  await page.getByRole('button', { name: 'Suivant' }).first().click()

  await page.getByTestId('onboarding-finish-btn').click()

  await expect(page).not.toHaveURL(/\/onboarding/, { timeout: 45_000 })
}
