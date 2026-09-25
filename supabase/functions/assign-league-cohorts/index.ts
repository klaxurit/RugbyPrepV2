import { corsHeaders, json } from '../_shared/http.ts'
import { captureEdgeException } from '../_shared/sentry.ts'
import { createClients } from '../_shared/supabase.ts'
import {
  buildCohorts,
  planMidWeekRefill,
  resolveLeagueCutoffs,
  type CohortCandidate,
  type ExistingCohortSnapshot,
} from '../../../src/services/gamification/cohortMatchmaking.ts'
import { promoteTier, relegateTier } from '../../../src/services/gamification/levels.ts'
import { isSociallyExposable } from '../../../src/services/gamification/socialExposure.ts'
import { previousWeekStartISO, weekStartISO } from '../../../src/services/gamification/weekStart.ts'

/**
 * Cron des ligues : clôture la semaine écoulée (lundi) puis constitue ou
 * recharge les cohortes de la semaine courante.
 *
 * Deux propriétés portées par `cohortMatchmaking` (testé côté Vitest) :
 *  - personne ne se retrouve seul dans sa ligue (fusion des paliers et des
 *    reliquats non viables) ;
 *  - les zones de promotion et de relégation sont proportionnelles à la taille
 *    réelle de la cohorte, donc une cohorte à moitié pleine ne voit pas la
 *    moitié de son tableau changer de palier.
 *
 * Mid-week : si les cohortes existent déjà, `planMidWeekRefill` y ajoute les
 * nouveaux opt-in `cohort` et fusionne les ligues solo — plus d’early-return
 * « déjà constituées ».
 *
 * Seuls les athlètes en visibilité `cohort` participent : le consentement est
 * filtré ici, la fonction d'appariement n'en fait aucun contrôle.
 */

interface ParticipantRow {
  id: string
  training_level: string | null
  weekly_sessions: number | null
  social_visibility: string
  display_name: string | null
  age_band: string | null
  health_consent_status: string | null
}

type TrainingLevel = CohortCandidate['trainingLevel']

function normalizeTrainingLevel(value: string | null): TrainingLevel {
  return value === 'starter' || value === 'builder' || value === 'performance'
    ? value
    : 'builder'
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
    const currentWeek = weekStartISO(todayISO)
    const closingWeek = previousWeekStartISO(currentWeek)

    // ─── 1. Clôture de la semaine écoulée ───────────────────────

    const { data: cohortsToClose, error: closeFetchError } = await serviceClient
      .from('league_cohorts')
      .select('id, tier')
      .eq('week_start', closingWeek)
      .is('closed_at', null)

    if (closeFetchError) return json({ error: closeFetchError.message }, 400)

    let closedCohorts = 0
    let promoted = 0
    let relegated = 0

    for (const cohort of cohortsToClose ?? []) {
      const { data: members, error: membersError } = await serviceClient
        .from('league_cohort_members')
        .select('user_id')
        .eq('cohort_id', cohort.id)

      if (membersError) return json({ error: membersError.message }, 400)

      const memberIds = (members ?? []).map((m) => m.user_id as string)
      if (memberIds.length === 0) continue

      const { data: scores, error: scoresError } = await serviceClient
        .from('gamification_weekly_scores')
        .select('user_id, points')
        .eq('week_start', closingWeek)
        .in('user_id', memberIds)

      if (scoresError) return json({ error: scoresError.message }, 400)

      const pointsByUser = new Map<string, number>()
      for (const id of memberIds) pointsByUser.set(id, 0)
      for (const row of scores ?? []) {
        pointsByUser.set(row.user_id as string, (row.points as number) ?? 0)
      }

      // Tri par points décroissants, puis par identifiant pour que le
      // classement soit déterministe à égalité.
      const ranked = [...pointsByUser.entries()].sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1]
        return a[0].localeCompare(b[0])
      })

      const cutoffs = resolveLeagueCutoffs(ranked.length)

      for (let i = 0; i < ranked.length; i++) {
        const [userId, points] = ranked[i]
        const rank = i + 1

        const outcome = (() => {
          if (cutoffs.promotionCutoff === 0) return 'stayed'
          if (rank <= cutoffs.promotionCutoff) return 'promoted'
          if (rank >= cutoffs.relegationCutoff) return 'relegated'
          return 'stayed'
        })()

        await serviceClient
          .from('league_cohort_members')
          .update({ final_rank: rank, points_snapshot: points, outcome })
          .eq('cohort_id', cohort.id)
          .eq('user_id', userId)

        if (outcome === 'stayed') continue

        const { data: gamificationRow } = await serviceClient
          .from('user_gamification_profile')
          .select('league_tier')
          .eq('user_id', userId)
          .maybeSingle()

        const tier = (gamificationRow?.league_tier ?? 'reserve') as Parameters<
          typeof promoteTier
        >[0]
        const nextTier = outcome === 'promoted' ? promoteTier(tier) : relegateTier(tier)

        if (nextTier === tier) continue

        await serviceClient
          .from('user_gamification_profile')
          .update({ league_tier: nextTier })
          .eq('user_id', userId)

        if (outcome === 'promoted') {
          promoted += 1
          await serviceClient.from('social_nudges').insert({
            user_id: userId,
            kind: 'league_promotion',
            payload: { tier: nextTier },
          })
        } else {
          relegated += 1
        }
      }

      await serviceClient
        .from('league_cohorts')
        .update({
          closed_at: new Date().toISOString(),
          promotion_cutoff: cutoffs.promotionCutoff,
          relegation_cutoff: cutoffs.relegationCutoff,
        })
        .eq('id', cohort.id)

      closedCohorts += 1
    }

    // ─── 2. Cohortes de la semaine courante ─────────────────────
    // Lundi : création. Mid-week : refill des opt-in tardifs + fusion anti-solo.

    const { data: existingRows, error: existingError } = await serviceClient
      .from('league_cohorts')
      .select('id, tier')
      .eq('week_start', currentWeek)
      .is('closed_at', null)

    if (existingError) return json({ error: existingError.message }, 400)

    const { data: participants, error: participantsError } = await serviceClient
      .from('profiles')
      .select(
        'id, training_level, weekly_sessions, social_visibility, display_name, age_band, health_consent_status',
      )
      .eq('social_visibility', 'cohort')

    if (participantsError) return json({ error: participantsError.message }, 400)

    const eligible = ((participants ?? []) as ParticipantRow[]).filter((row) =>
      isSociallyExposable(row, 'cohort'),
    )

    if (eligible.length === 0) {
      return json({ ok: true, closedCohorts, promoted, relegated, createdCohorts: 0, filled: 0 })
    }

    const { data: tiers, error: tiersError } = await serviceClient
      .from('user_gamification_profile')
      .select('user_id, league_tier')
      .in('user_id', eligible.map((p) => p.id))

    if (tiersError) return json({ error: tiersError.message }, 400)

    const tierByUser = new Map<string, CohortCandidate['tier']>()
    for (const row of tiers ?? []) {
      tierByUser.set(row.user_id as string, row.league_tier as CohortCandidate['tier'])
    }

    const { data: priorScores, error: priorError } = await serviceClient
      .from('gamification_weekly_scores')
      .select('user_id, points')
      .eq('week_start', closingWeek)
      .in('user_id', eligible.map((p) => p.id))

    if (priorError) return json({ error: priorError.message }, 400)

    const priorPointsByUser = new Map<string, number>()
    for (const row of priorScores ?? []) {
      priorPointsByUser.set(row.user_id as string, (row.points as number) ?? 0)
    }

    const candidates: CohortCandidate[] = eligible.map((row) => ({
      userId: row.id,
      tier: tierByUser.get(row.id) ?? 'reserve',
      trainingLevel: normalizeTrainingLevel(row.training_level),
      plannedWeeklySessions: row.weekly_sessions ?? 3,
      priorWeekPoints: priorPointsByUser.get(row.id) ?? 0,
    }))

    // ─── 2a. Refill mid-week si des cohortes existent déjà ──────

    if ((existingRows ?? []).length > 0) {
      const existingSnapshots: ExistingCohortSnapshot[] = []
      const assignedIds = new Set<string>()

      for (const row of existingRows ?? []) {
        const { data: members, error: membersError } = await serviceClient
          .from('league_cohort_members')
          .select('user_id')
          .eq('cohort_id', row.id)

        if (membersError) return json({ error: membersError.message }, 400)

        const memberIds = (members ?? []).map((m) => m.user_id as string)
        for (const id of memberIds) assignedIds.add(id)
        existingSnapshots.push({
          cohortId: row.id as string,
          tier: (row.tier as CohortCandidate['tier']) ?? 'reserve',
          memberIds,
        })
      }

      const unassigned = candidates.filter((c) => !assignedIds.has(c.userId))
      const plan = planMidWeekRefill(existingSnapshots, unassigned)

      let filled = 0
      let merged = 0
      let createdCohorts = 0

      for (const merge of plan.merges) {
        for (const userId of merge.userIds) {
          const { error: moveError } = await serviceClient
            .from('league_cohort_members')
            .update({ cohort_id: merge.toCohortId })
            .eq('cohort_id', merge.fromCohortId)
            .eq('user_id', userId)

          if (moveError) return json({ error: moveError.message }, 400)
          merged += 1
        }
      }

      for (const addition of plan.additions) {
        if (addition.userIds.length === 0) continue
        const { error: memberError } = await serviceClient
          .from('league_cohort_members')
          .insert(
            addition.userIds.map((userId) => ({
              cohort_id: addition.cohortId,
              user_id: userId,
            })),
          )

        if (memberError) return json({ error: memberError.message }, 400)
        filled += addition.userIds.length
      }

      for (const assignment of plan.newCohorts) {
        const cutoffs = resolveLeagueCutoffs(assignment.memberIds.length)
        const { data: created, error: createError } = await serviceClient
          .from('league_cohorts')
          .insert({
            week_start: currentWeek,
            tier: assignment.tier,
            promotion_cutoff: cutoffs.promotionCutoff,
            relegation_cutoff: cutoffs.relegationCutoff,
          })
          .select('id')
          .single()

        if (createError) return json({ error: createError.message }, 400)

        const { error: memberError } = await serviceClient
          .from('league_cohort_members')
          .insert(
            assignment.memberIds.map((userId) => ({
              cohort_id: created.id,
              user_id: userId,
            })),
          )

        if (memberError) return json({ error: memberError.message }, 400)
        createdCohorts += 1
        filled += assignment.memberIds.length
      }

      // Recalcule les seuils affichés pour les cohortes encore ouvertes
      // dont la taille a changé (refill / merge).
      for (const snap of existingSnapshots) {
        const { count, error: countError } = await serviceClient
          .from('league_cohort_members')
          .select('user_id', { count: 'exact', head: true })
          .eq('cohort_id', snap.cohortId)

        if (countError) return json({ error: countError.message }, 400)
        const size = count ?? 0
        if (size === 0) continue
        const cutoffs = resolveLeagueCutoffs(size)
        await serviceClient
          .from('league_cohorts')
          .update({
            promotion_cutoff: cutoffs.promotionCutoff,
            relegation_cutoff: cutoffs.relegationCutoff,
          })
          .eq('id', snap.cohortId)
      }

      return json({
        ok: true,
        closedCohorts,
        promoted,
        relegated,
        createdCohorts,
        filled,
        merged,
        note: 'Refill mid-week appliqué',
      })
    }

    // ─── 2b. Première constitution de la semaine ────────────────

    const assignments = buildCohorts(candidates)
    let createdCohorts = 0

    for (const assignment of assignments) {
      const cutoffs = resolveLeagueCutoffs(assignment.memberIds.length)

      const { data: created, error: createError } = await serviceClient
        .from('league_cohorts')
        .insert({
          week_start: currentWeek,
          tier: assignment.tier,
          promotion_cutoff: cutoffs.promotionCutoff,
          relegation_cutoff: cutoffs.relegationCutoff,
        })
        .select('id')
        .single()

      if (createError) return json({ error: createError.message }, 400)

      const { error: memberError } = await serviceClient
        .from('league_cohort_members')
        .insert(
          assignment.memberIds.map((userId) => ({
            cohort_id: created.id,
            user_id: userId,
          })),
        )

      if (memberError) return json({ error: memberError.message }, 400)

      createdCohorts += 1
    }

    return json({ ok: true, closedCohorts, promoted, relegated, createdCohorts })
  } catch (error) {
    await captureEdgeException(error, { function: 'assign-league-cohorts' })
    return json({ error: String(error) }, 500)
  }
})
