import { corsHeaders, json } from '../_shared/http.ts'
import { captureEdgeException } from '../_shared/sentry.ts'
import { createClients } from '../_shared/supabase.ts'
import { NUDGE_RULES } from '../../../src/services/gamification/scoreConstants.ts'
import { isSociallyExposable } from '../../../src/services/gamification/socialExposure.ts'
import { weekStartISO } from '../../../src/services/gamification/weekStart.ts'

/**
 * Cron de génération des nudges sociaux.
 *
 * Ne produit que des nudges correspondant à un **événement constaté** :
 * dépassement réel au classement, kudos réellement reçus, pouls du club
 * réellement non trivial. Aucune relance générique — une notification
 * « tu ne t'es pas entraîné depuis trois jours » n'a pas d'effet mesurable,
 * là où un événement de rang en a un.
 *
 * L'anti-spam est appliqué ici, en base, plutôt que dans le client : le quota
 * hebdomadaire est ainsi vérifiable et ne dépend pas de l'état local d'un
 * appareil.
 */

interface CohortMemberRow {
  cohort_id: string
  user_id: string
}

interface ScoreRow {
  user_id: string
  points: number
  sessions_completed: number
}

interface ProfileRow {
  id: string
  display_name: string | null
  club_code: string | null
  club_name: string | null
  social_visibility: string
  age_band: string | null
  health_consent_status: string | null
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const cronSecret = Deno.env.get('CRON_SHARED_SECRET')
  if (!cronSecret) return json({ error: 'Cron secret not configured' }, 500)
  if (req.headers.get('x-cron-secret') !== cronSecret) {
    return json({ error: 'Invalid cron secret' }, 401)
  }

  const { serviceClient } = createClients(req)

  try {
    const body = (await req.json().catch(() => ({}))) as { todayISO?: string }
    const todayISO = (body.todayISO ?? new Date().toISOString()).slice(0, 10)
    const week = weekStartISO(todayISO)

    const { data: profileRows, error: profileError } = await serviceClient
      .from('profiles')
      .select(
        'id, display_name, club_code, club_name, social_visibility, age_band, health_consent_status',
      )
      .neq('social_visibility', 'private')

    if (profileError) return json({ error: profileError.message }, 400)

    const profiles = ((profileRows ?? []) as ProfileRow[]).filter((row) =>
      isSociallyExposable(row, 'club'),
    )
    if (profiles.length === 0) return json({ ok: true, created: 0 })

    const profileById = new Map(profiles.map((row) => [row.id, row]))
    const userIds = profiles.map((row) => row.id)

    const { data: scoreRows, error: scoreError } = await serviceClient
      .from('gamification_weekly_scores')
      .select('user_id, points, sessions_completed')
      .eq('week_start', week)
      .in('user_id', userIds)

    if (scoreError) return json({ error: scoreError.message }, 400)

    const scores = new Map<string, ScoreRow>()
    for (const row of (scoreRows ?? []) as ScoreRow[]) scores.set(row.user_id, row)

    // Quota hebdomadaire déjà consommé, par athlète.
    const weekStartTimestamp = new Date(`${week}T00:00:00.000Z`).toISOString()
    const { data: existingNudges, error: existingError } = await serviceClient
      .from('social_nudges')
      .select('user_id, kind')
      .gte('created_at', weekStartTimestamp)
      .in('user_id', userIds)

    if (existingError) return json({ error: existingError.message }, 400)

    const nudgeCountByUser = new Map<string, number>()
    const nudgeKindsByUser = new Map<string, Set<string>>()
    for (const row of existingNudges ?? []) {
      const userId = row.user_id as string
      nudgeCountByUser.set(userId, (nudgeCountByUser.get(userId) ?? 0) + 1)
      const kinds = nudgeKindsByUser.get(userId) ?? new Set<string>()
      kinds.add(row.kind as string)
      nudgeKindsByUser.set(userId, kinds)
    }

    const pending: { user_id: string; kind: string; payload: Record<string, unknown> }[] = []

    const hasQuota = (userId: string) =>
      (nudgeCountByUser.get(userId) ?? 0) < NUDGE_RULES.MAX_PER_WEEK

    const alreadySent = (userId: string, kind: string) =>
      nudgeKindsByUser.get(userId)?.has(kind) === true

    const enqueue = (userId: string, kind: string, payload: Record<string, unknown>) => {
      if (!hasQuota(userId)) return
      if (alreadySent(userId, kind)) return
      pending.push({ user_id: userId, kind, payload })
      nudgeCountByUser.set(userId, (nudgeCountByUser.get(userId) ?? 0) + 1)
      const kinds = nudgeKindsByUser.get(userId) ?? new Set<string>()
      kinds.add(kind)
      nudgeKindsByUser.set(userId, kinds)
    }

    // ─── Dépassement au classement de cohorte ───────────────────
    // Le déclencheur de réengagement le plus fort d'une app de sport, parce
    // qu'il correspond à un événement dont l'athlète se soucie réellement.

    const { data: cohorts, error: cohortsError } = await serviceClient
      .from('league_cohorts')
      .select('id')
      .eq('week_start', week)

    if (cohortsError) return json({ error: cohortsError.message }, 400)

    for (const cohort of cohorts ?? []) {
      const { data: members, error: membersError } = await serviceClient
        .from('league_cohort_members')
        .select('cohort_id, user_id')
        .eq('cohort_id', cohort.id)

      if (membersError) return json({ error: membersError.message }, 400)

      const ranked = ((members ?? []) as CohortMemberRow[])
        .filter((member) => {
          const profile = profileById.get(member.user_id)
          return profile != null && isSociallyExposable(profile, 'cohort')
        })
        .map((member) => ({
          userId: member.user_id,
          points: scores.get(member.user_id)?.points ?? 0,
        }))
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points
          return a.userId.localeCompare(b.userId)
        })

      // Chaque athlète dépassé est prévenu par celui qui vient de le passer,
      // c'est-à-dire son voisin immédiat au-dessus. On n'annonce pas les rangs
      // lointains, qui ne sont pas actionnables.
      for (let i = 1; i < ranked.length; i++) {
        const above = ranked[i - 1]
        const below = ranked[i]
        if (above.points <= below.points) continue

        const overtaker = profileById.get(above.userId)
        if (!overtaker?.display_name) continue

        enqueue(below.userId, 'league_overtaken', {
          peerDisplayName: overtaker.display_name.trim(),
        })
      }
    }

    // ─── Kudos reçus ────────────────────────────────────────────

    const { data: kudosRows, error: kudosError } = await serviceClient
      .from('kudos')
      .select('to_user_id, from_user_id')
      .gte('created_at', weekStartTimestamp)
      .in('to_user_id', userIds)

    if (kudosError) return json({ error: kudosError.message }, 400)

    const kudosByUser = new Map<string, string[]>()
    for (const row of kudosRows ?? []) {
      const to = row.to_user_id as string
      const list = kudosByUser.get(to) ?? []
      list.push(row.from_user_id as string)
      kudosByUser.set(to, list)
    }

    for (const [userId, senders] of kudosByUser) {
      const soleSender = senders.length === 1 ? profileById.get(senders[0]) : null
      enqueue(userId, 'kudos_received', {
        count: senders.length,
        peerDisplayName: soleSender?.display_name?.trim() ?? null,
      })
    }

    // ─── Pouls du club ──────────────────────────────────────────
    // Information d'ambiance, non nominative, et muette en dessous de deux
    // athlètes actifs pour ne pas révéler une activité individuelle.

    const byClub = new Map<string, ProfileRow[]>()
    for (const profile of profiles) {
      const club = profile.club_code?.trim()
      if (!club) continue
      const list = byClub.get(club) ?? []
      list.push(profile)
      byClub.set(club, list)
    }

    for (const [, members] of byClub) {
      const active = members.filter(
        (member) => (scores.get(member.id)?.sessions_completed ?? 0) > 0,
      )
      for (const member of members) {
        const others = active.filter((other) => other.id !== member.id).length
        if (others < 2) continue
        enqueue(member.id, 'club_pulse', {
          athletesOnPlan: others,
          clubName: member.club_name ?? null,
        })
      }
    }

    if (pending.length === 0) return json({ ok: true, created: 0 })

    const expiresAt = new Date(
      Date.now() + NUDGE_RULES.TTL_HOURS * 3_600_000,
    ).toISOString()

    const { error: insertError } = await serviceClient
      .from('social_nudges')
      .insert(pending.map((row) => ({ ...row, expires_at: expiresAt })))

    if (insertError) return json({ error: insertError.message }, 400)

    return json({ ok: true, created: pending.length })
  } catch (error) {
    await captureEdgeException(error, { function: 'dispatch-social-nudges' })
    return json({ error: String(error) }, 500)
  }
})
