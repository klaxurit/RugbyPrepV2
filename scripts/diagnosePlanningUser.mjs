#!/usr/bin/env npx tsx
import { createClient } from '@supabase/supabase-js'
import { buildAthletePlanningInputs } from '../src/services/annualPlanning/buildAthletePlanningInputs.ts'
import { detectAnnualPlanningContext } from '../src/services/season/detectAnnualPlanningContext.ts'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or key')
  process.exit(1)
}

const email = process.argv[2] ?? 'juncahugo@gmail.com'
const sb = createClient(url, key)

const { data: userId, error: rpcErr } = await sb.rpc('admin_find_user_id_by_email', { p_email: email })
if (rpcErr || !userId) {
  console.error('RPC failed:', rpcErr?.message ?? 'no user')
  process.exit(1)
}

console.log('userId from RPC:', userId)

const { data: profiles, error: pErr } = await sb
  .from('profiles')
  .select('id, season_mode, planning_anchors, position, training_level, weekly_sessions')
  .eq('id', userId)

if (pErr) {
  console.error('profile error:', pErr.message)
  process.exit(2)
}
if (!profiles?.length) {
  console.warn('No profile row for user', userId, '— données probablement en localStorage uniquement')
  const { data: authUser, error: authErr } = await sb.auth.admin.getUserById(userId)
  if (authErr) console.warn('auth.admin.getUserById:', authErr.message)
  else {
    console.log('=== AUTH USER ===')
    console.log(JSON.stringify({ email: authUser.user?.email, created_at: authUser.user?.created_at }, null, 2))
  }
  const { data: matchesOnly } = await sb
    .from('match_calendar')
    .select('date, opponent, match_kind')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(5)
  console.log('\n=== RECENT MATCHES (sans profil) ===')
  console.log(JSON.stringify(matchesOnly, null, 2))
  process.exit(0)
}
const profile = profiles[0]

const { data: matches } = await sb
  .from('match_calendar')
  .select('date, opponent, match_kind, user_hidden')
  .eq('user_id', userId)
  .order('date', { ascending: false })
  .limit(10)

const { data: logs } = await sb
  .from('session_logs')
  .select('date_iso, session_type, completed')
  .eq('user_id', userId)
  .order('date_iso', { ascending: false })
  .limit(5)

const today = new Date().toISOString().slice(0, 10)
const events = (matches ?? []).map((m) => ({
  date: m.date,
  type: 'match',
  match_kind: m.match_kind,
  user_hidden: m.user_hidden,
}))
const { inputs } = buildAthletePlanningInputs({
  profile,
  events,
  logs: logs ?? [],
  today,
  fatigue: null,
  acwrZone: null,
})
const ctx = detectAnnualPlanningContext(inputs)

console.log('=== PROFILE ===')
console.log(JSON.stringify({ userId, email, season_mode: profile.season_mode, planning_anchors: profile.planning_anchors }, null, 2))

console.log('\n=== CONTEXT TODAY', today, '===')
console.log(
  JSON.stringify(
    {
      cycle: ctx.cycle,
      weekNumber: ctx.weekNumber,
      offSeasonPhase: ctx.offSeasonPhase,
      weekLabel: ctx.weekLabel,
      offSeasonStartAt: ctx.offSeasonStartAt,
      effectiveOffSeasonWeeks: ctx.effectiveOffSeasonWeeks,
      resolutionMode: ctx.planningTrace.resolutionMode,
      rulesApplied: ctx.planningTrace.rulesApplied,
      warnings: ctx.planningTrace.warnings,
    },
    null,
    2,
  ),
)

console.log('\n=== RECENT MATCHES ===')
console.log(JSON.stringify(matches, null, 2))
