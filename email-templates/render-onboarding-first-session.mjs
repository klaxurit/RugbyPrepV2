#!/usr/bin/env node
/**
 * Remplit onboarding-first-session.{html,txt} pour un destinataire.
 * Aucune dépendance npm.
 *
 * Usage :
 *   node email-templates/render-onboarding-first-session.mjs
 *   node email-templates/render-onboarding-first-session.mjs --first-name Hugo
 *   node email-templates/render-onboarding-first-session.mjs --first-name Hugo --cta-url 'https://…'
 *   node email-templates/render-onboarding-first-session.mjs --format txt
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const DEFAULT_CTA_URL =
  'https://rugbyforge.fr/?utm_source=email&utm_medium=relance&utm_campaign=1re_seance'

/** @param {string | null | undefined} firstName */
export function formatFirstNameToken(firstName) {
  const trimmed = typeof firstName === 'string' ? firstName.trim() : ''
  return trimmed ? ` ${trimmed}` : ''
}

/**
 * @param {string} template
 * @param {{ firstName?: string | null; ctaUrl?: string | null }} [vars]
 */
export function renderOnboardingFirstSession(template, vars = {}) {
  const firstNameToken = formatFirstNameToken(vars.firstName)
  const ctaUrl = (vars.ctaUrl && String(vars.ctaUrl).trim()) || DEFAULT_CTA_URL
  return template
    .replaceAll('{{FIRST_NAME}}', firstNameToken)
    .replaceAll('{{CTA_URL}}', ctaUrl)
}

function parseArgs(argv) {
  /** @type {{ firstName?: string; ctaUrl?: string; format: 'html' | 'txt'; out?: string }} */
  const opts = { format: 'html' }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--first-name') opts.firstName = argv[++i]
    else if (arg === '--cta-url') opts.ctaUrl = argv[++i]
    else if (arg === '--format') {
      const value = argv[++i]
      if (value !== 'html' && value !== 'txt') {
        throw new Error(`--format attend html|txt, reçu: ${value}`)
      }
      opts.format = value
    } else if (arg === '--out') opts.out = argv[++i]
    else if (arg === '--help' || arg === '-h') opts.help = true
  }
  return opts
}

function main() {
  const opts = parseArgs(process.argv.slice(2))
  if (opts.help) {
    console.log(`Usage:
  node email-templates/render-onboarding-first-session.mjs [--first-name NAME] [--cta-url URL] [--format html|txt] [--out FILE]

Variables:
  FIRST_NAME  vide → « Salut, » ; sinon « Salut NAME, »
  CTA_URL     défaut ${DEFAULT_CTA_URL}
`)
    return
  }

  const source = join(__dirname, `onboarding-first-session.${opts.format}`)
  const rendered = renderOnboardingFirstSession(readFileSync(source, 'utf8'), {
    firstName: opts.firstName,
    ctaUrl: opts.ctaUrl,
  })

  if (opts.out) {
    writeFileSync(opts.out, rendered, 'utf8')
    console.error(`Écrit ${opts.out} (${rendered.length} octets)`)
  } else {
    process.stdout.write(rendered)
  }
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isDirectRun) main()
