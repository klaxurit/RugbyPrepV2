#!/usr/bin/env npx tsx
/**
 * Dump cycle annuel résolu pour un athlète (profil + calendrier hardcodés
 * depuis prod juncahugo@gmail.com — snapshot 2026-11-06).
 *
 * Usage:
 *   npx tsx scripts/dumpAthleteAnnualCycle.mjs
 *   npx tsx scripts/dumpAthleteAnnualCycle.mjs --out tuto-output/junca-annual-dump.md
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildAthletePlanningInputs } from '../src/services/annualPlanning/buildAthletePlanningInputs.ts'
import { resolveMotherSessionsForWeek } from '../src/services/motherSession/resolveMotherSessionsForWeek.ts'
import { prepareSessionForRender } from '../src/services/session/prepareSessionForRender.ts'
import {
  formatMotherSessionSubtitle,
  formatTitleFromMotherSessionId,
} from '../src/components/motherSession/formatMotherSessionTitle.ts'
import { resolveBenchWavePhase, benchWaveLabel } from '../src/services/session/applyBenchWavePrescription.ts'
import { contentFamilyLabel } from '../src/data/contentFamily.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

const EMAIL = 'juncahugo@gmail.com'
const USER_ID = '05453755-b7d2-4cab-808b-9a9e185ffdb7'

/** Snapshot prod 2026-11-06 */
const PROFILE = {
  id: USER_ID,
  seasonMode: 'in_season',
  planningAnchors: {
    clubContactWeek: { level: 'normal', weekStartIso: '2026-08-31' },
    offSeasonStartAt: '2026-05-18',
    onboardingCycleHint: 'off_season',
    returnToTeamTrainingAt: '2026-08-10',
    skipOffSeasonRecoveryIntro: true,
  },
  position: 'BACK_ROW',
  rugbyPosition: 'BACK_ROW',
  trainingLevel: 'builder',
  weeklySessions: 3,
  equipment: [
    'barbell',
    'dumbbell',
    'bench',
    'pullup_bar',
    'band',
    'box',
    'machine',
    'cable',
    'landmine',
    'tbar_row',
    'ghd',
    'med_ball',
    'ab_wheel',
    'sprint_track',
  ],
  trainingBaseline: 'peak',
  trainingBaselineSetAt: '2026-06-28T07:04:25.672Z',
  onboardingComplete: true,
}

const MATCHES = [
  { date: '2026-05-17', opponent: 'LOVALI XV', match_kind: null, user_hidden: true },
  { date: '2026-09-13', opponent: 'C OMN REGION ELBEUVIENNE', match_kind: 'friendly', user_hidden: false },
  { date: '2026-09-27', opponent: 'R C DU BOCAGE VIROIS', match_kind: 'league', user_hidden: false },
  { date: '2026-10-04', opponent: 'R C ALENCON', match_kind: 'league', user_hidden: false },
  { date: '2026-10-11', opponent: 'BAYEUX RUGBY CLUB', match_kind: 'league', user_hidden: false },
  { date: '2026-11-08', opponent: 'R C ST LOIS', match_kind: 'league', user_hidden: false },
  { date: '2026-11-15', opponent: 'R C HEROUVILLAIS', match_kind: 'league', user_hidden: false },
  { date: '2026-11-22', opponent: 'C A AIGLON', match_kind: 'league', user_hidden: false },
  { date: '2026-12-06', opponent: 'R C CHERBOURG HAGUE', match_kind: 'league', user_hidden: false },
  { date: '2026-12-13', opponent: 'R C DU BOCAGE VIROIS', match_kind: 'league', user_hidden: false },
  { date: '2027-01-17', opponent: 'R C ALENCON', match_kind: 'league', user_hidden: false },
  { date: '2027-01-24', opponent: 'BAYEUX RUGBY CLUB', match_kind: 'league', user_hidden: false },
  { date: '2027-02-07', opponent: 'R C ST LOIS', match_kind: 'league', user_hidden: false },
  { date: '2027-02-21', opponent: 'R C HEROUVILLAIS', match_kind: 'league', user_hidden: false },
  { date: '2027-03-14', opponent: 'C A AIGLON', match_kind: 'league', user_hidden: false },
  { date: '2027-03-21', opponent: 'R C CHERBOURG HAGUE', match_kind: 'league', user_hidden: false },
]

const START_ISO = '2026-05-18'
const END_ISO = '2027-04-05'

function parseArgs(argv) {
  const outIdx = argv.indexOf('--out')
  return {
    out:
      outIdx >= 0 && argv[outIdx + 1]
        ? path.resolve(repoRoot, argv[outIdx + 1])
        : path.join(repoRoot, 'tuto-output', 'junca-annual-dump.md'),
  }
}

function startOfIsoWeekMonday(iso) {
  const d = new Date(`${iso}T12:00:00`)
  const day = d.getDay() // 0 Sun … 6 Sat
  const delta = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + delta)
  return d.toISOString().slice(0, 10)
}

function addDaysIso(iso, days) {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function mondaysBetween(startIso, endIso) {
  let cur = startOfIsoWeekMonday(startIso)
  const end = startOfIsoWeekMonday(endIso)
  const out = []
  while (cur <= end) {
    out.push(cur)
    cur = addDaysIso(cur, 7)
  }
  return out
}

function matchLabel(dateIso, matches) {
  const mon = startOfIsoWeekMonday(dateIso)
  const sun = addDaysIso(mon, 6)
  return matches
    .filter((m) => !m.user_hidden && m.date >= mon && m.date <= sun)
    .map((m) => `${m.date} ${m.opponent}${m.match_kind ? ` (${m.match_kind})` : ''}`)
}

function formatDuration(d) {
  if (!d) return '?'
  if (typeof d === 'string') return d
  if (d.min != null && d.max != null) return `${d.min}-${d.max} min`
  return String(d)
}

function renderSessionMd(slot, ctx, profile) {
  const meso = ctx.mesocycleWeek ?? null
  const prepared = prepareSessionForRender({
    session: slot.session,
    trainingLevel: profile.trainingLevel,
    equipment: profile.equipment,
    lang: 'fr',
    mesocycleWeek: meso,
    weekNumber: ctx.weekNumber ?? null,
    isMatchWeek: ctx.isMatchWeek === true,
    isDeloadWeek: ctx.isDeloadWeek === true,
    clubContactProxy: ctx.clubContactProxy,
    rugbyPosition: profile.rugbyPosition,
    dayPreference: slot.dayPreference ?? null,
    contentFamily: ctx.contentFamily ?? null,
  })

  const title = formatTitleFromMotherSessionId(prepared.metadata.id, 'fr', {
    contentFamily: ctx.contentFamily ?? null,
  })

  const subtitle = formatMotherSessionSubtitle(prepared.metadata.id, 'fr', {
    mesocycleWeek: meso ?? undefined,
    trainingLevel: profile.trainingLevel,
    isMatchWeek: ctx.isMatchWeek === true,
    isDeloadWeek: ctx.isDeloadWeek === true,
    dayPreference: slot.dayPreference ?? null,
  })

  let benchNote = ''
  if (meso != null && /UPPER_IN_SEASON_/.test(prepared.metadata.id) && !/_BW_/i.test(prepared.metadata.id)) {
    const phase = resolveBenchWavePhase({
      mesocycleWeek: meso,
      isDeloadWeek: ctx.isDeloadWeek === true,
      isMatchWeek: ctx.isMatchWeek === true,
      dayPreference: slot.dayPreference ?? null,
    })
    benchNote = ` · vague Bench: ${benchWaveLabel(phase, 'fr')} (S${meso})`
  }

  const m = prepared.metadata
  const lines = []
  lines.push(`#### \`${m.id}\` — ${title}`)
  if (subtitle) lines.push(`- sous-titre: ${subtitle}`)
  lines.push(
    `- rôle: \`${slot.role}\`${slot.dayPreference ? ` · jour: \`${slot.dayPreference}\`` : ''}${slot.variant ? ` · variant: \`${slot.variant}\`` : ''}${slot.maxBlocks != null ? ` · maxBlocks: ${slot.maxBlocks}` : ''}${benchNote}`,
  )
  lines.push(
    `- type: \`${m.sessionType}\` · cycle: \`${m.cycle}\` · durée: ${formatDuration(m.targetDuration)} · eq: \`${m.equipment}\` · poste: \`${m.targetPositionGroup}\` · niveau: \`${m.targetLevel}\``,
  )
  if (prepared.goal?.length) {
    lines.push(`- goals:`)
    for (const g of prepared.goal) lines.push(`  - ${g}`)
  }
  if (prepared.sessionIdentity?.length) {
    lines.push(`- identity: ${prepared.sessionIdentity.join(' / ')}`)
  }

  for (const block of prepared.blocks) {
    const opt = block.isOptional ? ' (optionnel)' : ''
    const fmt = block.format ? ` — ${block.format}` : ''
    lines.push(`- **B${block.number} ${block.name}**${opt}${fmt}`)
    for (const ex of block.exercises) {
      const note = ex.notes ? ` _(${ex.notes})_` : ''
      lines.push(`  - ${ex.name} [${ex.prescription}]${note}`)
    }
  }
  return { md: lines.join('\n'), preparedId: m.id, title }
}

function main() {
  const { out } = parseArgs(process.argv.slice(2))
  const events = MATCHES.filter((m) => !m.user_hidden).map((m) => ({
    date: m.date,
    type: 'match',
    match_kind: m.match_kind ?? undefined,
  }))

  const weeks = mondaysBetween(START_ISO, END_ISO)
  const lines = []
  const uniqueIds = new Map() // id -> { title, weeks: [] }
  const cycleCounts = {}
  const idFrequency = new Map()

  lines.push(`# Dump cycle annuel — ${EMAIL}`)
  lines.push('')
  lines.push(`Généré le ${new Date().toISOString().slice(0, 10)} · user \`${USER_ID}\``)
  lines.push('')
  lines.push(`## Profil`)
  lines.push('')
  lines.push(`- poste: **${PROFILE.rugbyPosition}** (groupe résolu via resolver)`)
  lines.push(`- niveau: **${PROFILE.trainingLevel}** · baseline: **${PROFILE.trainingBaseline}**`)
  lines.push(`- fréquence: **${PROFILE.weeklySessions}/sem**`)
  lines.push(`- matériel: full gym (\`${PROFILE.equipment.length}\` items, incl. \`sprint_track\`)`)
  lines.push(`- ancres: offSeasonStartAt=\`${PROFILE.planningAnchors.offSeasonStartAt}\` · returnToTeam=\`${PROFILE.planningAnchors.returnToTeamTrainingAt}\` · skipRecoveryIntro=\`${PROFILE.planningAnchors.skipOffSeasonRecoveryIntro}\``)
  lines.push(`- fenêtre dump: **${START_ISO} → ${END_ISO}** (${weeks.length} semaines ISO)`)
  lines.push(`- matchs visibles: **${MATCHES.filter((m) => !m.user_hidden).length}** (1 hidden LOVALI XV 2026-05-17)`)
  lines.push('')
  lines.push(`## Timeline (résumé)`)
  lines.push('')
  lines.push(`| Semaine | Cycle | Phase / label | Meso | Match | Sessions |`)
  lines.push(`|---------|-------|---------------|------|-------|----------|`)

  const weekDetails = []

  for (const monday of weeks) {
    const today = monday
    const { inputs, warnings: buildWarnings, derived } = buildAthletePlanningInputs({
      profile: PROFILE,
      events,
      logs: [],
      today,
      fatigue: null,
      acwrZone: null,
    })

    const resolved = resolveMotherSessionsForWeek(inputs)
    const ctx = resolved.planningContext
    const cycle = ctx.cycle
    cycleCounts[cycle] = (cycleCounts[cycle] ?? 0) + 1

    const phaseBits = [
      ctx.weekLabel ?? null,
      ctx.offSeasonPhase != null ? `offP${ctx.offSeasonPhase}` : null,
      ctx.preSeasonPhase != null ? `preP${ctx.preSeasonPhase}` : null,
      ctx.inSeasonSubMode && ctx.inSeasonSubMode !== 'competition' ? ctx.inSeasonSubMode : null,
      ctx.isMatchWeek ? 'MATCH' : null,
      ctx.isDeloadWeek ? 'DELOAD' : null,
      ctx.contentFamily ? contentFamilyLabel(ctx.contentFamily, 'fr') : null,
    ]
      .filter(Boolean)
      .join(' · ')

    const meso =
      ctx.mesocycleWeek != null
        ? `S${ctx.mesocycleWeek}${ctx.mesocycleBlock != null ? `/B${ctx.mesocycleBlock}` : ''}`
        : '—'

    const matches = matchLabel(monday, MATCHES)
    const matchCell = matches.length ? matches.join('; ') : '—'

    const sessionIds = resolved.sessions.map((s) => s.sessionId)
    for (const id of sessionIds) {
      idFrequency.set(id, (idFrequency.get(id) ?? 0) + 1)
    }

    lines.push(
      `| ${monday} | \`${cycle}\` | ${phaseBits || '—'} | ${meso} | ${matchCell} | ${sessionIds.map((id) => `\`${id}\``).join('<br>') || '—'} |`,
    )

    weekDetails.push({
      monday,
      inputs,
      resolved,
      ctx,
      derived,
      buildWarnings,
      matches,
      phaseBits,
      meso,
    })
  }

  lines.push('')
  lines.push(`### Compteurs`)
  lines.push('')
  for (const [c, n] of Object.entries(cycleCounts)) {
    lines.push(`- \`${c}\`: ${n} semaines`)
  }
  lines.push(`- mothers distinctes planifiées: **${idFrequency.size}**`)
  lines.push('')
  lines.push(`### Fréquence mothers (top)`)
  lines.push('')
  const top = [...idFrequency.entries()].sort((a, b) => b[1] - a[1])
  for (const [id, n] of top) {
    lines.push(`- \`${id}\` × ${n}`)
  }

  lines.push('')
  lines.push(`## Détail semaine par semaine`)
  lines.push('')

  for (const w of weekDetails) {
    const { monday, resolved, ctx, derived, buildWarnings, matches, phaseBits, meso } = w
    lines.push(`### Semaine du ${monday}`)
    lines.push('')
    lines.push(
      `- cycle: \`${ctx.cycle}\` · weekNumber: ${ctx.weekNumber ?? '—'} · meso: ${meso} · famille: \`${ctx.contentFamily ?? '—'}\` · positionGroup: \`${derived.resolvedPositionGroup}\``,
    )
    lines.push(`- label: ${phaseBits || '—'}`)
    if (matches.length) lines.push(`- matchs: ${matches.join(' · ')}`)
    if (resolved.templateContext) {
      const t = resolved.templateContext
      lines.push(
        `- template: freq ${t.requestedFrequency}→${t.effectiveFrequency} · matchContext: \`${t.matchContext ?? '—'}\` · fatigue: \`${t.fatigueLevel}\``,
      )
    }
    lines.push(`- status resolver: \`${resolved.status}\``)
    const warns = [...(buildWarnings ?? []), ...(resolved.warnings ?? [])]
    if (warns.length) {
      lines.push(`- warnings:`)
      for (const x of warns) lines.push(`  - ${x}`)
    }
    if (resolved.missingSessionIds?.length) {
      lines.push(`- missing: ${resolved.missingSessionIds.map((id) => `\`${id}\``).join(', ')}`)
    }
    if (resolved.companionRecommendations?.length) {
      lines.push(`- companions: ${resolved.companionRecommendations.join(' · ')}`)
    }
    lines.push('')

    if (!resolved.sessions.length) {
      lines.push('_Aucune séance résolue._')
      lines.push('')
      continue
    }

    for (const slot of resolved.sessions) {
      const { md, preparedId, title } = renderSessionMd(slot, ctx, PROFILE)
      lines.push(md)
      lines.push('')
      if (!uniqueIds.has(preparedId)) {
        uniqueIds.set(preparedId, { title, weeks: [monday] })
      } else {
        uniqueIds.get(preparedId).weeks.push(monday)
      }
    }
  }

  lines.push(`## Index mothers utilisées`)
  lines.push('')
  for (const [id, meta] of [...uniqueIds.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push(
      `- \`${id}\` — ${meta.title} _(×${meta.weeks.length} : ${meta.weeks[0]}…${meta.weeks[meta.weeks.length - 1]})_`,
    )
  }
  lines.push('')
  lines.push(`---`)
  lines.push(`_Fin du dump — ${weeks.length} semaines, ${uniqueIds.size} mothers distinctes._`)
  lines.push('')

  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, lines.join('\n'), 'utf8')
  console.log(`Wrote ${out}`)
  console.log(`weeks=${weeks.length} uniqueMothers=${uniqueIds.size}`)
  console.log('cycles', cycleCounts)
}

main()
