/**
 * CLI interne : upsert idempotent des memberships staff planning (service role).
 *
 * Usage :
 *   node scripts/manageStaffPlanningMemberships.mjs upsert-staff ./chemin/staff.json [--dry-run]
 *   node scripts/manageStaffPlanningMemberships.mjs upsert-athletes ./chemin/athletes.json [--dry-run]
 *
 * Variables d'environnement obligatoires :
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

function fail(msg) {
  console.error(`[staff-planning-memberships] ${msg}`)
  process.exit(1)
}

function requireEnv(name) {
  const v = process.env[name]
  if (v === undefined || String(v).trim() === '') {
    fail(`Variable d'environnement manquante ou vide : ${name}`)
  }
  return v.trim()
}

async function loadStaffMembershipAdminModule() {
  const cacheDir = path.join(repoRoot, 'node_modules', '.cache', 'rugby-staff-cli')
  fs.mkdirSync(cacheDir, { recursive: true })

  const tsconfigPath = path.join(cacheDir, 'tsconfig.json')
  const srcFile = path.join(repoRoot, 'src', 'services', 'staffPlanning', 'staffMembershipAdmin.ts')
  const outFile = path.join(cacheDir, 'staffMembershipAdmin.js')

  const relFile = path.relative(cacheDir, srcFile).split(path.sep).join('/')

  const tsconfig = {
    compilerOptions: {
      target: 'ES2022',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      outDir: '.',
      strict: true,
      skipLibCheck: true,
      declaration: false,
      noEmitOnError: true,
    },
    files: [relFile],
  }

  fs.writeFileSync(tsconfigPath, `${JSON.stringify(tsconfig, null, 2)}\n`)

  const tscJs = path.join(repoRoot, 'node_modules', 'typescript', 'lib', 'tsc.js')
  if (!fs.existsSync(tscJs)) {
    fail('TypeScript introuvable (node_modules/typescript). Exécute npm install à la racine du repo.')
  }

  const res = spawnSync(process.execPath, [tscJs, '-p', tsconfigPath], {
    cwd: cacheDir,
    encoding: 'utf8',
  })

  if (res.status !== 0) {
    console.error(res.stdout || '')
    console.error(res.stderr || '')
    fail('Compilation de staffMembershipAdmin.ts échouée.')
  }

  if (!fs.existsSync(outFile)) {
    fail(`Fichier émis introuvable : ${outFile}`)
  }

  return import(pathToFileURL(outFile).href)
}

function readJsonArray(filePath) {
  const abs = path.resolve(process.cwd(), filePath)
  if (!fs.existsSync(abs)) {
    fail(`Fichier introuvable : ${abs}`)
  }
  const raw = fs.readFileSync(abs, 'utf8')
  let data
  try {
    data = JSON.parse(raw)
  } catch {
    fail(`JSON invalide : ${abs}`)
  }
  if (!Array.isArray(data)) {
    fail(`Le JSON doit être un tableau d'objets : ${abs}`)
  }
  return { abs, data }
}

async function findStaffRowId(supabase, row) {
  let q = supabase
    .from('club_staff_memberships')
    .select('id')
    .eq('staff_user_id', row.staff_user_id)
    .eq('club_id', row.club_id)
    .limit(1)
  q = row.squad_id == null ? q.is('squad_id', null) : q.eq('squad_id', row.squad_id)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return data?.[0]?.id ?? null
}

async function upsertStaffRow(supabase, row) {
  const id = await findStaffRowId(supabase, row)
  if (id) {
    const { error } = await supabase
      .from('club_staff_memberships')
      .update({
        role: row.role,
        status: row.status,
        metadata: row.metadata,
      })
      .eq('id', id)
    if (error) throw new Error(error.message)
    return 'updated'
  }
  const { error } = await supabase.from('club_staff_memberships').insert(row)
  if (error) throw new Error(error.message)
  return 'inserted'
}

async function findAthleteRowId(supabase, row) {
  let q = supabase
    .from('club_athlete_memberships')
    .select('id')
    .eq('athlete_user_id', row.athlete_user_id)
    .eq('club_id', row.club_id)
    .limit(1)
  q = row.squad_id == null ? q.is('squad_id', null) : q.eq('squad_id', row.squad_id)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return data?.[0]?.id ?? null
}

async function upsertAthleteRow(supabase, row) {
  const id = await findAthleteRowId(supabase, row)
  if (id) {
    const { error } = await supabase
      .from('club_athlete_memberships')
      .update({
        status: row.status,
        source: row.source,
        metadata: row.metadata,
      })
      .eq('id', id)
    if (error) throw new Error(error.message)
    return 'updated'
  }
  const { error } = await supabase.from('club_athlete_memberships').insert(row)
  if (error) throw new Error(error.message)
  return 'inserted'
}

async function main() {
  const mod = await loadStaffMembershipAdminModule()
  const { parseManageStaffPlanningCliArgs, prepareStaffMembershipUpserts, prepareAthleteMembershipUpserts } = mod

  const parsed = parseManageStaffPlanningCliArgs(process.argv)
  if (parsed.error) {
    fail(parsed.error)
  }

  const { command, filePath, dryRun } = parsed
  const { abs, data } = readJsonArray(filePath)

  console.log('[staff-planning-memberships] ─────────────────────────────')
  console.log(`  Fichier      : ${abs}`)
  console.log(`  Commande     : ${command}`)
  console.log(`  Mode         : ${dryRun ? 'dry-run (aucune écriture)' : 'apply'}`)
  console.log(`  Lignes lues  : ${data.length}`)

  let batch
  if (command === 'upsert-staff') {
    batch = prepareStaffMembershipUpserts(data)
  } else {
    batch = prepareAthleteMembershipUpserts(data)
  }

  if (batch.errors.length > 0) {
    console.log(`  Erreurs validation : ${batch.errors.length}`)
    for (const e of batch.errors) console.log(`    - ${e}`)
  }
  if (batch.warnings.length > 0) {
    console.log(`  Avertissements     : ${batch.warnings.length}`)
    for (const w of batch.warnings) console.log(`    - ${w}`)
  }

  console.log(`  Lignes valides (après dédup) : ${batch.rows.length}`)

  if (batch.rows.length === 0) {
    console.log('[staff-planning-memberships] Rien à appliquer.')
    process.exit(batch.errors.length > 0 ? 1 : 0)
  }

  if (dryRun) {
    console.log('[staff-planning-memberships] Dry-run terminé (aucune écriture Supabase).')
    process.exit(batch.errors.length > 0 ? 1 : 0)
  }

  const supabaseUrl = requireEnv('SUPABASE_URL')
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  let inserted = 0
  let updated = 0

  try {
    if (command === 'upsert-staff') {
      for (const row of batch.rows) {
        const op = await upsertStaffRow(supabase, row)
        if (op === 'inserted') inserted += 1
        else updated += 1
      }
    } else {
      for (const row of batch.rows) {
        const op = await upsertAthleteRow(supabase, row)
        if (op === 'inserted') inserted += 1
        else updated += 1
      }
    }
  } catch (e) {
    fail(e instanceof Error ? e.message : String(e))
  }

  console.log(`  Insérées  : ${inserted}`)
  console.log(`  Mises à jour : ${updated}`)
  console.log('[staff-planning-memberships] Terminé.')
  process.exit(batch.errors.length > 0 ? 1 : 0)
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)))
