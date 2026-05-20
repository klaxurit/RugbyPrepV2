import { resolve } from 'node:path'

import { config as loadEnvFromFile } from 'dotenv'
import { defineConfig, devices } from '@playwright/test'

/** Playwright ne lit pas `.env` / `.env.local` tout seul ; charge pour les secrets E2E (hors bundle Vite). */
loadEnvFromFile({ path: resolve(process.cwd(), '.env') })
loadEnvFromFile({ path: resolve(process.cwd(), '.env.local'), override: true })

const PREVIEW_ORIGIN = 'http://127.0.0.1:4173'

/**
 * Valeurs injectées au `npm run build` du webServer.
 * Sans URL/clé Supabase, le client prod jette au chargement → écran vide, smoke KO.
 * Les secrets CI (ou .env.local) priment ; sinon repli sûr pour routes publiques.
 */
const E2E_SUPABASE_URL =
  process.env.VITE_SUPABASE_URL?.trim() || 'https://placeholder.supabase.co'
const E2E_SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY?.trim() ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder'

/** Env passé explicitement au build preview — évite un bundle sans config Supabase. */
const webServerEnv: Record<string, string> = {
  ...process.env,
  VITE_SUPABASE_URL: E2E_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: E2E_SUPABASE_ANON_KEY,
}

export default defineConfig({
  testDir: './e2e',
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? PREVIEW_ORIGIN,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // PWA precache peut masquer des régressions de routing en preview.
    serviceWorkers: 'block',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npx vite preview --host 127.0.0.1 --port 4173 --strictPort',
    url: `${PREVIEW_ORIGIN}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: webServerEnv,
  },
})
