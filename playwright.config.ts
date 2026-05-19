import { resolve } from 'node:path'

import { config as loadEnvFromFile } from 'dotenv'
import { defineConfig, devices } from '@playwright/test'

/** Playwright ne lit pas `.env` / `.env.local` tout seul ; charge pour les secrets E2E (hors bundle Vite). */
loadEnvFromFile({ path: resolve(process.cwd(), '.env') })
loadEnvFromFile({ path: resolve(process.cwd(), '.env.local'), override: true })

const PREVIEW_ORIGIN = 'http://127.0.0.1:4173'

export default defineConfig({
  testDir: './e2e',
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? PREVIEW_ORIGIN,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npx vite preview --host 127.0.0.1 --port 4173 --strictPort',
    url: `${PREVIEW_ORIGIN}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
