#!/usr/bin/env node
/**
 * Audit V1 — Passe 1 quantitative.
 * Scan les 39 mother sessions, agrège volume par muscle × pattern, détecte outliers.
 *
 * Usage : node scripts/auditPassOne.mjs
 * Output :
 *   - docs/audit-v1/PASS1_QUANTITATIVE_SCAN.md (tableau lisible)
 *   - docs/audit-v1/PASS1_OUTLIERS.json (anomalies détectées)
 *
 * Seuils : METHODOLOGY.md (Schoenfeld 2024, Barr 2022, Reyneke 2025)
 */

import fs from 'node:fs'

const ROOT = process.cwd()
const MS_PATH = `${ROOT}/src/data/motherSessions.generated.ts`
const EX_PATH = `${ROOT}/src/data/exercices.v1.json`
const MAP_PATH = `${ROOT}/src/services/motherSession/motherSessionExerciseMap.ts`

// ─── Load data ────────────────────────────────────────────────

const msText = fs.readFileSync(MS_PATH, 'utf8')
const mapText = fs.readFileSync(MAP_PATH, 'utf8')
const exJson = JSON.parse(fs.readFileSync(EX_PATH, 'utf8'))

// Build MS_EXERCISE_MAP name → exerciseId
const msMap = new Map()
for (const m of mapText.matchAll(/'([^']+)':\s*'([^']+)'/g)) {
  msMap.set(m[1].toLowerCase().trim(), m[2])
}

// Build exercise catalog by id
const exById = new Map(exJson.map((e) => [e.exerciseId?.toLowerCase(), e]))

// Parse the MOTHER_SESSIONS array. The TS file contains:
//   export const MOTHER_SESSIONS: MotherSession[] = [ ... ]
//   export const MOTHER_SESSIONS_BY_ID ... .reduce(...)
// So the array spans from its opening `[` to the last `]` before MOTHER_SESSIONS_BY_ID.
const declIdx = msText.indexOf('MOTHER_SESSIONS: MotherSession[] = [')
if (declIdx === -1) throw new Error('Could not locate MOTHER_SESSIONS declaration.')
const byIdIdx = msText.indexOf('export const MOTHER_SESSIONS_BY_ID', declIdx)
if (byIdIdx === -1) throw new Error('Could not locate MOTHER_SESSIONS_BY_ID marker.')
const arrStart = msText.indexOf('= [', declIdx) + 2
const arrEnd = msText.lastIndexOf(']', byIdIdx)
const arrText = msText.slice(arrStart, arrEnd + 1)
const sessions = JSON.parse(arrText)

console.log(`Loaded ${sessions.length} mother sessions.`)

// ─── Classification helpers ───────────────────────────────────

function classifyMuscle(pattern, tags = [], id = '') {
  const t = new Set(tags.map((s) => s.toLowerCase()))
  const p = (pattern || '').toLowerCase()
  const prefix = id.split('__')[0] || ''
  const lid = id.toLowerCase()

  // Plyometric / power prefix takes priority : even if pattern tag is 'squat'
  // (e.g. squat jump), the movement is power work, not pure hypertrophy volume.
  if (prefix === 'power' || prefix === 'full_power' || prefix === 'olympic_variant' ||
      prefix === 'lower_jump') {
    if (lid.includes('push_press') || lid.includes('chest_pass') || lid.includes('explosive_press') ||
        lid.includes('landmine_press') || lid.includes('plyo_push')) {
      return 'epaules'
    }
    if (lid.includes('medball_rotational') || lid.includes('med_ball_rotational')) return 'core'
    if (t.has('upper')) return 'epaules'
    return 'power_lower'
  }

  if (p === 'squat' || prefix === 'squat' || prefix === 'lower_squat') return 'quadriceps'
  if (p === 'hinge' || prefix === 'hinge') return 'hamstrings_glutes'
  if (prefix === 'hamstring' || prefix === 'hamstrings') return 'hamstrings_glutes'
  if (p === 'push_horizontal' || prefix === 'push_horizontal') return 'pectoraux'
  if (p === 'push_vertical' || prefix === 'push_vertical') return 'epaules'
  if (p === 'pull_horizontal' || prefix === 'pull_horizontal') return 'dos'
  if (p === 'pull_vertical' || prefix === 'pull_vertical') return 'dos'
  if (prefix === 'arm_curl') return 'bras_biceps'
  if (prefix === 'arm_extension') return 'bras_triceps'
  if (prefix === 'shoulder_isolation') return 'epaules'
  if (prefix === 'calf') return 'triceps_sural'
  if (prefix === 'tibialis') return 'tibialis' // antagoniste (dorsiflexion), pas triceps sural
  if (prefix === 'core_anti_extension' || prefix === 'core_anti_rotation' || prefix === 'core_rotation') return 'core'
  // Prehab shoulder : la plupart sont scapular / rotator (prehab pur), MAIS face_pull,
  // band_pull_apart et T-Y-I sont fonctionnellement des pulls (rear delt + rhomboïdes +
  // trap moyen/inférieur). On les route vers 'dos' pour l'analyse antagoniste.
  if (prefix === 'prehab_shoulder') {
    if (lid.includes('face_pull') || lid.includes('band_pull_apart') || lid.includes('tyi') ||
        lid.includes('scap_retraction')) {
      return 'dos'
    }
    return 'prehab_upper'
  }
  if (prefix === 'neck' || prefix === 'upper_trap') return 'prehab_upper'
  if (prefix === 'lower_lunge' || prefix === 'lower_step') return 'quadriceps'
  if (prefix === 'lower_rehab' || prefix === 'knee_extension') return 'quadriceps'
  if (prefix === 'groin_adductors') return 'prehab_lower'
  if (prefix === 'carry') return 'carry'
  if (prefix === 'sled') return 'conditioning'
  if (prefix === 'sprint') return 'sprint'
  if (prefix === 'agility') return 'agility'
  if (prefix === 'conditioning') return 'conditioning'
  if (prefix === 'mobility' || prefix === 'activation' || prefix === 'warmup' || prefix === 'cooldown') return 'mobility'
  if (prefix === 'locomotion') return 'locomotion'
  if (t.has('core')) return 'core'
  return 'other'
}

// Returns ALL patterns an exercise covers (may return multiple). Knee-dominant unilateral
// counts as "squat_family" ; Olympic-style pushes count as both "plyo" and "push".
function classifyPatterns(pattern, tags = [], id = '') {
  const out = new Set()
  const prefix = id.split('__')[0] || ''
  const p = (pattern || '').toLowerCase()
  const lid = id.toLowerCase()

  // Squat-family (knee-dominant) — includes squat, lunge, split squat, step-up.
  // Trap bar deadlift est classé hinge en catalogue mais couvre le pattern squat
  // fonctionnellement (Swinton 2011) : torse vertical, flexion genoux marquée, axial loading.
  if (p === 'squat' || prefix === 'squat' || prefix === 'lower_squat' ||
      prefix === 'lower_lunge' || prefix === 'lower_step' || prefix === 'knee_extension' ||
      lid.includes('deadlift__trap_bar')) {
    out.add('squat')
  }
  // Hinge-family (hip-dominant)
  if (p === 'hinge' || prefix === 'hinge' || prefix === 'hamstring' || prefix === 'hamstrings') {
    out.add('hinge')
  }
  // Push / pull patterns (include olympic variants that are functionally push/pull)
  if (p === 'push_horizontal' || p === 'push_vertical' || prefix.startsWith('push_')) out.add('push')
  if (p === 'pull_horizontal' || p === 'pull_vertical' || prefix.startsWith('pull_')) out.add('pull')
  if (lid.includes('push_press') || lid.includes('chest_pass') || lid.includes('plyo_push')) out.add('push')
  if (lid.includes('med_ball_chest') || lid.includes('explosive_press')) out.add('push')

  // Unilateral tag (informational)
  if (prefix === 'lower_lunge' || prefix === 'lower_step' || lid.includes('split_squat') || lid.includes('single_leg')) {
    out.add('unilateral')
  }
  if (prefix === 'carry' || prefix === 'sled') out.add('carry')
  if (prefix === 'power' || prefix === 'lower_jump' || prefix === 'full_power' || prefix === 'olympic_variant') {
    out.add('plyo')
  }
  if (prefix === 'sprint' || prefix === 'agility') out.add('sprint')
  if (prefix.startsWith('core_')) out.add('core')
  if (prefix === 'prehab_shoulder' || prefix === 'neck' || prefix === 'groin_adductors' || prefix === 'tibialis') {
    out.add('prehab')
  }
  return [...out]
}

// Parse prescription like "3x10-12", "2-3x20-30s/side", "1x8/side" → sets count.
// If no explicit NxM, fall back to block `format` (e.g. "3 rounds", "1 round").
function parseSetsFromPrescription(prescription) {
  if (!prescription || typeof prescription !== 'string') return null
  const s = prescription.trim().toLowerCase()
  const m = s.match(/^(\d+)(?:\s*[-–]\s*(\d+))?\s*x/)
  if (!m) return null
  const lo = parseInt(m[1], 10)
  const hi = m[2] ? parseInt(m[2], 10) : lo
  if (Number.isNaN(lo)) return null
  return (lo + hi) / 2
}

function parseSetsFromFormat(format) {
  if (!format || typeof format !== 'string') return null
  const s = format.toLowerCase()
  const m = s.match(/(\d+)(?:\s*[-–]\s*(\d+))?\s*(rounds?|rds)\b/)
  if (!m) return null
  const lo = parseInt(m[1], 10)
  const hi = m[2] ? parseInt(m[2], 10) : lo
  if (Number.isNaN(lo)) return null
  return (lo + hi) / 2
}

function parseSets(prescription, blockFormat) {
  const fromPresc = parseSetsFromPrescription(prescription)
  if (fromPresc !== null) return fromPresc
  const fromFmt = parseSetsFromFormat(blockFormat)
  if (fromFmt !== null) return fromFmt
  // Fallback: exercise has a prescription (reps or time) but no sets specified — assume 1 set.
  if (prescription && prescription.trim()) return 1
  return 0
}

// ─── Iterate sessions ─────────────────────────────────────────

const perSessionStats = []
const outliers = []

// Thresholds from METHODOLOGY.md (Schoenfeld 2024 dose-response)
// Per-session upper limit before it's "too dense" (weekly MAV / 2-3 sessions/sem)
const PER_SESSION_MUSCLE_MAX = {
  quadriceps: 10,
  hamstrings_glutes: 10,
  pectoraux: 10,
  dos: 12,
  epaules: 10,
  bras_biceps: 8,
  bras_triceps: 8,
  triceps_sural: 6,
  core: 8,
}

for (const session of sessions) {
  const id = session.metadata.id
  const cycle = session.metadata.cycle
  const sessionType = session.metadata.sessionType
  const targetLevel = session.metadata.targetLevel
  const targetDuration = session.metadata.targetDuration
  const injurySubs = (session.injurySubstitutions || []).map((s) => s.area)
  const muscleAgg = {}
  const patternPresent = new Set()
  let unknownCount = 0
  let totalWorkingSets = 0
  let warmupSets = 0
  const blocks = session.blocks || []

  // Warm-up : sets count for duration only, and pattern detection (prehab/mobility).
  for (const w of (session.warmUp?.exercises || [])) {
    const rawName = (w.name || '').toLowerCase().trim()
    const s = parseSets(w.prescription, null)
    warmupSets += s
    const exId = msMap.get(rawName)
    if (exId) {
      const ex = exById.get(exId.toLowerCase())
      if (ex) {
        for (const p of classifyPatterns(ex.pattern, ex.tags, ex.exerciseId)) patternPresent.add(p)
      }
    }
  }

  function resolveNameToId(name) {
    if (msMap.has(name)) return msMap.get(name)
    // "X or Y" alternative strings — fall back to first option (equivalent usage).
    if (name.includes(' or ')) {
      const first = name.split(' or ')[0].trim()
      if (msMap.has(first)) return msMap.get(first)
    }
    return null
  }

  for (const block of blocks) {
    const blockFmt = block.format
    for (const exo of block.exercises || []) {
      const rawName = (exo.name || '').toLowerCase().trim()
      const sets = parseSets(exo.prescription, blockFmt)
      if (sets === 0) continue
      totalWorkingSets += sets

      const exId = resolveNameToId(rawName)
      if (!exId) {
        // Not a real exercise (descriptor or unmapped)
        unknownCount += 1
        continue
      }
      const ex = exById.get(exId.toLowerCase())
      if (!ex) {
        unknownCount += 1
        continue
      }

      const muscle = classifyMuscle(ex.pattern, ex.tags, ex.exerciseId)
      const patterns = classifyPatterns(ex.pattern, ex.tags, ex.exerciseId)
      muscleAgg[muscle] = (muscleAgg[muscle] || 0) + sets
      for (const p of patterns) patternPresent.add(p)
    }
  }

  // Duration estimate : warm-up (10 min base), working sets ~3 min incl. rest+transition.
  // Calibrated against declared durations in motherSessions (typically 45-70 min for 12-22 sets).
  const totalSets = totalWorkingSets + warmupSets
  const estDurationMin = Math.round(10 + totalWorkingSets * 3)
  const declaredRange = (targetDuration || '').match(/(\d+)\s*-\s*(\d+)\s*min/)
  const durationIssue = declaredRange
    ? estDurationMin < parseInt(declaredRange[1], 10) - 10 || estDurationMin > parseInt(declaredRange[2], 10) + 10
    : false

  const sessionOutliers = []

  // 1) Muscle over-volume per session
  for (const [muscle, sets] of Object.entries(muscleAgg)) {
    const max = PER_SESSION_MUSCLE_MAX[muscle]
    if (max && sets > max) {
      sessionOutliers.push({
        type: 'volume_excessive',
        muscle, sets, maxPerSession: max,
        severity: sets > max * 1.3 ? 'high' : 'medium',
      })
    }
  }

  // 2) Injury coverage — expect shoulder/knee/low_back for any strength session
  const isStrengthSession = ['lower', 'upper', 'full'].includes(sessionType)
  if (isStrengthSession && cycle !== 'recovery') {
    const requiredZones = ['shoulder_pain', 'knee_pain', 'low_back_pain']
    const missing = requiredZones.filter((z) => !injurySubs.includes(z))
    if (missing.length > 0) {
      sessionOutliers.push({
        type: 'injury_coverage_gap',
        missingZones: missing,
        severity: 'medium',
      })
    }
  }

  // 3) Pattern coverage — rugby-specific checks per session type
  if (sessionType === 'full') {
    const required = ['squat', 'hinge', 'push', 'pull']
    const missing = required.filter((p) => !patternPresent.has(p))
    if (missing.length > 0) {
      sessionOutliers.push({
        type: 'rugby_pattern_gap',
        missingPatterns: missing,
        severity: 'medium',
      })
    }
  }

  if (sessionType === 'lower') {
    const required = ['squat', 'hinge']
    const missing = required.filter((p) => !patternPresent.has(p))
    if (missing.length > 0) {
      sessionOutliers.push({
        type: 'rugby_pattern_gap',
        missingPatterns: missing,
        severity: 'medium',
      })
    }
  }

  if (sessionType === 'upper') {
    const required = ['push', 'pull']
    const missing = required.filter((p) => !patternPresent.has(p))
    if (missing.length > 0) {
      sessionOutliers.push({
        type: 'rugby_pattern_gap',
        missingPatterns: missing,
        severity: 'medium',
      })
    }
    if (!patternPresent.has('prehab')) {
      sessionOutliers.push({
        type: 'missing_prehab',
        note: 'Upper session sans prehab (band pull-apart / scap push-up / face pull)',
        severity: 'low',
      })
    }
  }

  // 3bis) Antagonist balance — push/pull sets ratio (full/upper).
  // Push = horizontal (pectoraux) + vertical (épaules). Pull = dos.
  if (['full', 'upper'].includes(sessionType)) {
    const pushSets = (muscleAgg.pectoraux || 0) + (muscleAgg.epaules || 0)
    const pullSets = muscleAgg.dos || 0
    if (pushSets > 0 && pullSets > 0) {
      const ratio = pushSets / pullSets
      if (ratio > 1.5) {
        sessionOutliers.push({
          type: 'antagonist_imbalance',
          axis: 'push_gt_pull',
          pushSets, pullSets, ratio: Math.round(ratio * 100) / 100,
          severity: 'medium',
        })
      } else if (ratio < 0.6) {
        sessionOutliers.push({
          type: 'antagonist_imbalance',
          axis: 'pull_gt_push',
          pushSets, pullSets, ratio: Math.round(ratio * 100) / 100,
          severity: 'low',
        })
      }
    } else if (pushSets > 0 && pullSets === 0) {
      sessionOutliers.push({
        type: 'antagonist_imbalance',
        axis: 'push_only_no_pull',
        pushSets, pullSets,
        severity: 'high',
      })
    } else if (pullSets > 0 && pushSets === 0 && sessionType !== 'lower') {
      sessionOutliers.push({
        type: 'antagonist_imbalance',
        axis: 'pull_only_no_push',
        pushSets, pullSets,
        severity: 'medium',
      })
    }
  }

  // 3ter) Quad:Hamstring ratio (lower/full)
  if (['full', 'lower'].includes(sessionType)) {
    const quadSets = muscleAgg.quadriceps || 0
    const hamSets = muscleAgg.hamstrings_glutes || 0
    if (quadSets > 0 && hamSets > 0) {
      const ratio = quadSets / hamSets
      if (ratio > 1.5) {
        sessionOutliers.push({
          type: 'quad_ham_imbalance',
          axis: 'quad_gt_ham',
          quadSets, hamSets, ratio: Math.round(ratio * 100) / 100,
          severity: 'medium',
          note: 'Ratio quad:ham > 1.5 → facteur de risque ischio (Buchheit 2010)',
        })
      }
    } else if (quadSets > 0 && hamSets === 0) {
      sessionOutliers.push({
        type: 'quad_ham_imbalance',
        axis: 'quad_only_no_ham',
        severity: 'high',
        note: 'Session lower/full sans chaîne postérieure — risque élevé',
      })
    }
  }

  // 4) Duration : estimation affichée seulement, pas en outlier (formule naïve face aux
  //    blocs en paire/contrast/triset où le temps ≠ serial sets × 3 min).
  void durationIssue

  // 5) Too many unmapped/descriptor exercises with sets
  if (unknownCount > 3) {
    sessionOutliers.push({
      type: 'many_unmapped_exercises',
      count: unknownCount,
      severity: 'low',
    })
  }

  perSessionStats.push({
    id, cycle, sessionType, targetLevel, targetDuration,
    nbBlocks: blocks.length,
    totalSets: Math.round(totalSets * 10) / 10,
    estDurationMin,
    muscleAgg: Object.fromEntries(
      Object.entries(muscleAgg).map(([k, v]) => [k, Math.round(v * 10) / 10])
    ),
    patternsPresent: [...patternPresent].sort(),
    injurySubsCovered: injurySubs,
    unknownExercisesWithSets: unknownCount,
    outliers: sessionOutliers,
  })

  if (sessionOutliers.length > 0) {
    outliers.push({ id, cycle, sessionType, outliers: sessionOutliers })
  }
}

// ─── Write outputs ────────────────────────────────────────────

fs.writeFileSync(
  `${ROOT}/docs/audit-v1/PASS1_OUTLIERS.json`,
  JSON.stringify({ generatedAt: new Date().toISOString(), outliers, perSessionStats }, null, 2)
)

// Markdown report
const cycles = ['off_season', 'pre_season', 'in_season', 'speed_power']
const byCycle = {}
for (const s of perSessionStats) {
  const k = s.cycle || 'unknown'
  byCycle[k] = byCycle[k] || []
  byCycle[k].push(s)
}

let md = `# Passe 1 — Scan quantitatif

> Généré le ${new Date().toISOString().slice(0, 10)} par \`scripts/auditPassOne.mjs\`.
> Seuils : \`docs/audit-v1/METHODOLOGY.md\` (Schoenfeld 2024 dose-response).

## Synthèse globale

- **Sessions scannées** : ${sessions.length}
- **Sessions avec au moins 1 outlier** : ${outliers.length}
- **Outliers totaux** : ${outliers.reduce((n, s) => n + s.outliers.length, 0)}

### Outliers par type

`

const byType = {}
for (const s of outliers) for (const o of s.outliers) {
  byType[o.type] = (byType[o.type] || 0) + 1
}
md += `| Type d'outlier | Occurrences |\n|---|---:|\n`
for (const [t, n] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
  md += `| ${t} | ${n} |\n`
}
md += `\n`

// Per cycle tables
for (const cycle of Object.keys(byCycle).sort()) {
  md += `## ${cycle.toUpperCase()} (${byCycle[cycle].length} sessions)\n\n`
  md += `| Session | Type | Niveau | Blocs | Sets | Durée est. | Outliers |\n`
  md += `|---|---|---|---:|---:|---:|:---|\n`
  for (const s of byCycle[cycle]) {
    const tags = s.outliers.map((o) => `\`${o.type}${o.severity === 'high' ? '!!' : o.severity === 'medium' ? '!' : ''}\``).join(' ')
    md += `| ${s.id} | ${s.sessionType} | ${s.targetLevel} | ${s.nbBlocks} | ${s.totalSets} | ${s.estDurationMin} min | ${tags || '—'} |\n`
  }
  md += `\n`
}

// Group outliers by severity for actionable triage
const bySeverity = { high: [], medium: [], low: [] }
for (const s of outliers) for (const o of s.outliers) {
  const sev = o.severity || 'low'
  bySeverity[sev].push({ session: s.id, ...o })
}
md += `## Triage par sévérité\n\n`
md += `### ⚠️ HIGH (à corriger en V1)\n\n`
if (bySeverity.high.length === 0) md += `_Aucun._\n\n`
else for (const o of bySeverity.high) {
  md += `- **${o.session}** — ${o.type} : ${o.note || JSON.stringify({ ...o, session: undefined, type: undefined, severity: undefined })}\n`
}
md += `\n### MEDIUM (à revoir en V1)\n\n`
if (bySeverity.medium.length === 0) md += `_Aucun._\n\n`
else for (const o of bySeverity.medium) {
  md += `- **${o.session}** — ${o.type} : ${o.note || JSON.stringify({ ...o, session: undefined, type: undefined, severity: undefined })}\n`
}
md += `\n### LOW (optionnel / note)\n\n`
if (bySeverity.low.length === 0) md += `_Aucun._\n\n`
else for (const o of bySeverity.low) {
  md += `- **${o.session}** — ${o.type} : ${o.note || JSON.stringify({ ...o, session: undefined, type: undefined, severity: undefined })}\n`
}

md += `\n## Détail complet des outliers (par session)\n\n`
for (const s of outliers) {
  md += `### ${s.id}\n\n`
  for (const o of s.outliers) {
    md += `- **${o.type}** [${o.severity}] — ${JSON.stringify({ ...o, type: undefined, severity: undefined })}\n`
  }
  md += `\n`
}

md += `## Volume par muscle × session (détail)\n\n`
md += `Volume brut (sets) observé par session. À croiser avec fréquence hebdo pour obtenir le volume/semaine.\n\n`
for (const s of perSessionStats) {
  const pairs = Object.entries(s.muscleAgg)
    .filter(([k, v]) => v > 0 && !['mobility', 'warmup', 'cooldown'].includes(k))
    .sort((a, b) => b[1] - a[1])
  if (pairs.length === 0) continue
  md += `- **${s.id}** — ${pairs.map(([k, v]) => `${k}:${v}`).join(' · ')}\n`
}

fs.writeFileSync(`${ROOT}/docs/audit-v1/PASS1_QUANTITATIVE_SCAN.md`, md)

console.log()
console.log(`✅ Wrote docs/audit-v1/PASS1_QUANTITATIVE_SCAN.md`)
console.log(`✅ Wrote docs/audit-v1/PASS1_OUTLIERS.json`)
console.log(`   ${outliers.length} sessions with outliers, ${outliers.reduce((n, s) => n + s.outliers.length, 0)} outliers total`)
