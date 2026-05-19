import type { Page } from '@playwright/test'

/** Bandeau cookies pré-auth — libellés FR (CookieConsentBanner). */
export async function dismissCookieBannerIfPresent(page: Page): Promise<void> {
  const decline = page.getByRole('button', { name: 'Refuser' })
  const accept = page.getByRole('button', { name: 'Accepter' })
  if (await decline.isVisible().catch(() => false)) {
    await decline.click()
    return
  }
  if (await accept.isVisible().catch(() => false)) await accept.click()
}
