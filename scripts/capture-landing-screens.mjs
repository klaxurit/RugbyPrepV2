/**
 * Capture phone-sized marketing screens into public/images/landing/.
 * Run: node scripts/capture-landing-screens.mjs
 */
import { chromium } from 'playwright'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const mocks = path.join(__dirname, 'landing-screen-mocks')
const outDir = path.join(root, 'public/images/landing')

const jobs = [
  { file: 'home.html', out: 'rugbyforge_home_game.png', webp: true },
  { file: 'week-match.html', out: 'rugbyforge_week_match.png' },
  { file: 'fatigue-choice.html', out: 'rugbyforge_fatigue_choice.png' },
]

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
})

for (const job of jobs) {
  const url = `file://${path.join(mocks, job.file)}`
  await page.goto(url)
  await page.waitForTimeout(200)
  const outPath = path.join(outDir, job.out)
  await page.screenshot({ path: outPath, type: 'png' })
  console.log('wrote', outPath)
  if (job.webp) {
    const webpPath = outPath.replace(/\.png$/, '.webp')
    try {
      execFileSync('cwebp', ['-q', '82', outPath, '-o', webpPath])
      console.log('wrote', webpPath)
    } catch (err) {
      console.warn('cwebp failed', err.message)
    }
  }
}

await browser.close()
console.log('done')
