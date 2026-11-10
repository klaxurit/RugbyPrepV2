#!/usr/bin/env node
/**
 * Génère les mothers in-season multi-familles à partir des clusters
 * FRONT_ROW (pack) et BACK_THREE (backs), en différenciant finisher + identité.
 * Ne touche pas aux fichiers FRONT_ROW / BACK_THREE sources.
 *
 * Usage: node scripts/generateContentFamilyMothers.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const DIR = path.join(ROOT, 'docs/training/mother-sessions/in-season')

const PACK_FAMILIES = ['SECOND_ROW', 'BACK_ROW']
const BACKS_FAMILIES = ['HALF_BACKS', 'CENTERS']

/** Upper lane suffixes (après FAMILY_). Vide = base V1. */
const PACK_UPPER_LANES = ['', 'CHESTPASS', 'LANDMINE', 'SUPINE']
const BACKS_UPPER_LANES = ['', 'LANDMINE', 'PLYO', 'ROTATIONAL', 'PUSHPRESS']

const PACK_LOWER_LANES = ['', 'FRONTSQUAT', 'TBRDL', 'PAUSEJUMP']
const BACKS_LOWER_LANES = ['', 'RDL', 'SLHIP', 'SHRUG']

const UPPER_FINISHER = {
  FRONT_ROW: {
    title: 'Front Row Finisher',
    a: 'Farmer Carry or Zercher Carry',
    aRx: '20m',
    b: 'Neck Isometric',
    bRx: '15-20s',
    notes: [
      'Carry choice depends on setup and player comfort.',
      'Rotate neck directions across rounds: flexion, extension, left lateral, right lateral.',
      'This block should feel specific and robust, not exhausting.',
    ],
  },
  SECOND_ROW: {
    title: 'Second Row Finisher',
    a: 'Neutral-Grip Pull-Up',
    aRx: '3-4 quality reps @ RER 2-3',
    b: 'Pallof Press Hold',
    bRx: '15-20s/side',
    notes: [
      'Pull-up stays strict — lockout and scapular control for lineout/maul demand.',
      'Pallof reinforces trunk stiffness without adding heavy carry fatigue.',
      'This finisher is not a front-row carry+neck copy.',
    ],
  },
  BACK_ROW: {
    title: 'Back Row Finisher',
    a: 'Farmer Carry',
    aRx: '20m',
    b: 'Band Rotation Explosive',
    bRx: '3-4/side',
    notes: [
      'Farmer carry supports tackle/ruck grip and locomotion.',
      'Explosive band rotation adds contact-transfer without a second heavy pull.',
      'Do not swap back to Zercher+neck front-row signature.',
    ],
  },
  HALF_BACKS: {
    title: 'Half-Backs Finisher',
    a: 'Pallof Press Hold',
    aRx: '15-20s/side',
    b: 'Band Rotation Explosive',
    bRx: '3/side',
    notes: [
      'Low residual cost — anti-rotation then short rotational intent.',
      'Keep volume low; this is transmission/coordination, not hypertrophy.',
      'No promise of passing skill — gym transfer only.',
    ],
  },
  CENTERS: {
    title: 'Centres Finisher',
    a: 'Suitcase Carry',
    aRx: '20m/side',
    b: 'Med Ball Rotational Throw',
    bRx: '3/side',
    notes: [
      'Suitcase + rotational throw = contact stiffness with power compromise.',
      'Distinct from half-backs (no heavy anti-rot only) and back three (less pure ballistic).',
      'Stop throws as soon as quality drops.',
    ],
  },
  BACK_THREE: {
    title: 'Back Three Finisher',
    a: 'Suitcase Carry',
    aRx: '20m/side',
    b: 'Pallof Press Hold or Neck Isometric',
    bRx: '15-20s',
    notes: [
      'Default version favors trunk control and unilateral stiffness.',
      'If more contact robustness is needed that week, replace the Pallof hold with neck isometrics.',
      'This block should reinforce posture and athletic stability, not create heavy residual fatigue.',
    ],
  },
}

const LOWER_FINISHER = {
  FRONT_ROW: {
    title: 'Front Row Finisher',
    a: 'Sled Push',
    aRx: '15-20m',
    b: 'Copenhagen Plank',
    bRx: '15-20s/side',
    notes: [
      'Sled push reinforces horizontal force, bracing, and scrum-like projection without adding much eccentric fatigue.',
      'Copenhagen plank gives useful adductor/trunk exposure for scrum and collision demands.',
      'If no sled is available, replace with `Zercher Carry` or `Farmer Carry` over `20m`.',
    ],
  },
  SECOND_ROW: {
    title: 'Second Row Finisher',
    a: 'Countermovement Jump',
    aRx: '3 quality reps',
    b: 'Copenhagen Plank',
    bRx: '15-20s/side',
    notes: [
      'CMJ keeps jump/landing quality for lineout without heavy sled scrum bias.',
      'Copenhagen maintains groin robustness.',
      'Not a sled-push front-row finisher rename.',
    ],
  },
  BACK_ROW: {
    title: 'Back Row Finisher',
    a: 'Sled Drag Backward',
    aRx: '15-20m',
    b: 'Copenhagen Plank',
    bRx: '15-20s/side',
    notes: [
      'Backward sled drag biases propulsion/braking for tackle/ruck work.',
      'If no sled: `Farmer Carry` `20m` instead — keep Copenhagen.',
      'Do not default to forward sled-push front-row signature.',
    ],
  },
  HALF_BACKS: {
    title: 'Half-Backs Finisher',
    a: 'Bear Crawl',
    aRx: '10-15m',
    b: 'Copenhagen Plank',
    bRx: '15s/side',
    notes: [
      'Low residual locomotion + short groin dose.',
      'Keep crisp — this is not a conditioning finisher.',
    ],
  },
  CENTERS: {
    title: 'Centres Finisher',
    a: 'Light Sled Push',
    aRx: '15-20m',
    b: 'Copenhagen Plank',
    bRx: '15-20s/side',
    notes: [
      'Light sled keeps horizontal force under constraint without max scrum loading.',
      'If no sled: `Suitcase Carry` `20m/side`.',
    ],
  },
  BACK_THREE: {
    title: 'Back Three Finisher',
    a: 'Light Sled Push',
    aRx: '15-20m',
    b: 'Copenhagen Plank',
    bRx: '15-20s/side',
    notes: [
      'Keep light and crisp — speed bias, not scrum loading.',
      'If no sled: `Farmer Carry` `20m`.',
    ],
  },
}

const FAMILY_LABEL = {
  SECOND_ROW: 'second-row',
  BACK_ROW: 'back-row',
  HALF_BACKS: 'half-backs',
  CENTERS: 'centres',
}

function sourceId(kind, clusterFamily, lane) {
  const laneBit = lane ? `_${lane}` : ''
  return `${kind}_IN_SEASON_${clusterFamily}${laneBit}_V1`
}

function targetId(kind, family, lane) {
  const laneBit = lane ? `_${lane}` : ''
  return `${kind}_IN_SEASON_${family}${laneBit}_V1`
}

function replaceFinisher(md, kind, family) {
  const fin = kind === 'UPPER' ? UPPER_FINISHER[family] : LOWER_FINISHER[family]
  if (!fin) throw new Error(`No finisher for ${kind} ${family}`)

  const notes = fin.notes.map((n) => `  - ${n}`).join('\n')
  const block = `### Block 3 - ${fin.title}
- Format: \`EMOM 8'\`
- Exercise A: minute 1 \`${fin.a}\` \`${fin.aRx}\`
- Exercise B: minute 2 \`${fin.b}\` \`${fin.bRx}\`
- Coaching notes:
${notes}`

  // Replace Block 3 section until next ## or ### Optional / ## Progression
  const re =
    /### Block 3 -[\s\S]*?(?=\n### Optional Block|\n## Progression Rules|\n## Position Accent)/
  if (!re.test(md)) {
    throw new Error(`Block 3 not found for family ${family}`)
  }
  return md.replace(re, `${block}\n\n`)
}

function adaptMarkdown(md, { sourceId: src, targetId: tgt, family, kind, clusterFamily }) {
  let out = md
  out = out.replaceAll(src, tgt)
  out = out.replace(
    /`- \`target_position_group\`: .+/,
    `- \`target_position_group\`: ${family.toLowerCase()}`,
  )
  // Some files use without backticks differently
  out = out.replace(
    /target_position_group\`: .+/,
    `target_position_group\`: ${family.toLowerCase()}`,
  )
  out = out.replace(
    new RegExp(`target_position_group\`: ${clusterFamily.toLowerCase()}`, 'g'),
    `target_position_group\`: ${family.toLowerCase()}`,
  )

  const label = FAMILY_LABEL[family] ?? family.toLowerCase()
  out = out.replace(/Front-row specific/gi, `${label} specific`)
  out = out.replace(/Back-three specific/gi, `${label} specific`)
  out = out.replace(/front-row signature/gi, `${label} signature`)
  out = out.replace(/Front Row Finisher/g, UPPER_FINISHER[family]?.title?.includes('Finisher')
    ? (kind === 'UPPER' ? UPPER_FINISHER[family].title : LOWER_FINISHER[family].title)
    : `${label} Finisher`)
  out = out.replace(/Back Three Finisher/g, kind === 'UPPER' ? UPPER_FINISHER[family].title : LOWER_FINISHER[family].title)

  out = replaceFinisher(out, kind, family)

  // Identity bullets — mark family
  out = out.replace(
    /## Session Identity\n/,
    `## Session Identity\n- Content family: \`${family.toLowerCase()}\` — distinct integrated finisher vs other families.\n`,
  )

  return out
}

function generateOne(kind, family, lane, clusterFamily) {
  const src = sourceId(kind, clusterFamily, lane)
  const tgt = targetId(kind, family, lane)
  const srcPath = path.join(DIR, `${src}.md`)
  const tgtPath = path.join(DIR, `${tgt}.md`)
  if (!fs.existsSync(srcPath)) {
    console.warn('SKIP missing source', src)
    return null
  }
  const md = fs.readFileSync(srcPath, 'utf8')
  const out = adaptMarkdown(md, { sourceId: src, targetId: tgt, family, kind, clusterFamily })
  fs.writeFileSync(tgtPath, out)
  return tgt
}

function main() {
  const written = []
  for (const family of PACK_FAMILIES) {
    for (const lane of PACK_UPPER_LANES) {
      written.push(generateOne('UPPER', family, lane, 'FRONT_ROW'))
    }
    for (const lane of PACK_LOWER_LANES) {
      written.push(generateOne('LOWER', family, lane, 'FRONT_ROW'))
    }
  }
  for (const family of BACKS_FAMILIES) {
    for (const lane of BACKS_UPPER_LANES) {
      written.push(generateOne('UPPER', family, lane, 'BACK_THREE'))
    }
    for (const lane of BACKS_LOWER_LANES) {
      written.push(generateOne('LOWER', family, lane, 'BACK_THREE'))
    }
  }
  // Also refresh finishers on existing FRONT_ROW / BACK_THREE? Keep as-is (canonical).
  const ok = written.filter(Boolean)
  console.log(`Wrote ${ok.length} mother sessions`)
  for (const id of ok) console.log(' ', id)
}

main()
