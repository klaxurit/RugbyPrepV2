import { corsHeaders, json } from '../_shared/http.ts'
import { captureEdgeException } from '../_shared/sentry.ts'
import { requireUser } from '../_shared/supabase.ts'
import { computeWeeklyScore } from '../../../src/services/gamification/computeWeeklyScore.ts'
import { deriveWeeklyScoreInput } from '../../../src/services/gamification/deriveWeeklyScoreInput.ts'
import { hasLeveledUp, resolveLevel } from '../../../src/services/gamification/levels.ts'
import { SCORE_CAPS } from '../../../src/services/gamification/scoreConstants.ts'
import { weekStartISO } from '../../../src/services/gamification/weekStart.ts'
import { priorStreakForWeek, resolveWeekStreak } from '../../../src/services/gamification/weekStreak.ts'

/**
 * Recalcule le score de gamification d'un athlète pour une semaine.
 *
 * Appelée après l'enregistrement d'une séance, et par le cron de clôture
 * hebdomadaire.
 *
 * Répartition de l'autorité :
 *  - Le **client** transmet le plan de la semaine (nombre de séances prévues,
 *    dates, deload, matchs), parce que le moteur de planification vit dans
 *    l'app.
 *  - Le **serveur** relit les séances dans `session_logs`, recalcule l'ACWR,
 *    applique les plafonds et écrit. Un client ne peut donc pas s'attribuer
 *    des séances qu'il n'a pas enregistrées, et le nombre de séances prévues
 *    est borné par `MAX_PLANNED_SESSIONS_PER_WEEK`.
 *
 * La formule est importée de `src/services/gamification/` et n'est pas
 * dupliquée ici : c'est la seule façon d'éviter une divergence entre le score
 * affiché et le score écrit. Ces modules sont purs (aucun import React,
 * aucun accès DOM) et couverts par Vitest.
 */

interface SessionLogRow {
  date_iso: string
  session_type: string
  rpe: number | null
  duration_min: number | null
}

interface RecomputeBody {
  /** Jour de référence, YYYY-MM-DD. Défaut : aujourd'hui. */
  todayISO?: string
  /** Dates des séances prévues cette semaine, YYYY-MM-DD. */
  plannedSessionDates?: string[]
  /** Dates de match de la semaine, YYYY-MM-DD. */
  matchDates?: string[]
  isDeloadWeek?: boolean
  /** Séances d'une semaine de charge normale pour cet athlète. */
  referenceSessionCount?: number
}

/** Charge (UA) = RPE × durée. Même définition que `useACWR` côté client. */
function loadOf(row: SessionLogRow): number {
  if (row.rpe == null || row.duration_min == null) return 0
  return row.rpe * row.duration_min
}

function daysBetween(fromISO: string, toISO: string): number {
  const from = new Date(`${fromISO.slice(0, 10)}T12:00:00`).getTime()
  const to = new Date(`${toISO.slice(0, 10)}T12:00:00`).getTime()
  return Math.round((to - from) / 86_400_000)
}

/**
 * Zone ACWR recalculée côté serveur.
 *
 * Reprend les paramètres de `src/hooks/useACWR.ts` : ratio non couplé
 * (aigu 7 j / moyenne des 4 semaines précédentes), plancher chronique à 500 UA,
 * récup active exclue, et au moins deux semaines de données.
 */
function resolveAcwrZone(
  rows: SessionLogRow[],
  todayISO: string,
): 'underload' | 'optimal' | 'caution' | 'danger' | 'critical' | null {
  const training = rows.filter(
    (r) => r.session_type !== 'ACTIVE_RECOVERY' && r.session_type !== 'RECOVERY',
  )

  const loadInWindow = (fromDaysAgo: number, toDaysAgo: number): number =>
    training.reduce((sum, row) => {
      const age = daysBetween(row.date_iso, todayISO)
      return age >= toDaysAgo && age < fromDaysAgo ? sum + loadOf(row) : sum
    }, 0)

  const acuteLoad = loadInWindow(7, 0)

  const weekLoads: number[] = []
  for (let i = 1; i <= 4; i++) {
    weekLoads.push(loadInWindow((i + 1) * 7, i * 7))
  }
  const chronicLoad = weekLoads.reduce((sum, value) => sum + value, 0) / 4
  const weeksWithData = weekLoads.filter((value) => value > 0).length +
    (acuteLoad > 0 ? 1 : 0)

  if (weeksWithData < 2 || chronicLoad === 0) return null

  const CHRONIC_FLOOR = 500
  const ratio = acuteLoad / Math.max(chronicLoad, CHRONIC_FLOOR)

  if (ratio < 0.8) return 'underload'
  if (ratio <= 1.3) return 'optimal'
  if (ratio < 1.5) return 'caution'
  if (ratio < 2) return 'danger'
  return 'critical'
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const { user, serviceClient } = await requireUser(req)
  if (!user) return json({ error: 'Authentication required' }, 401)

  try {
    const body = (await req.json().catch(() => ({}))) as RecomputeBody
    const todayISO = (body.todayISO ?? new Date().toISOString()).slice(0, 10)
    const monday = weekStartISO(todayISO)

    // 35 jours d'historique : la semaine aiguë plus les 4 semaines chroniques.
    const historyStart = new Date(`${monday}T12:00:00`)
    historyStart.setDate(historyStart.getDate() - 35)

    const { data: logRows, error: logsError } = await serviceClient
      .from('session_logs')
      .select('date_iso, session_type, rpe, duration_min')
      .eq('user_id', user.id)
      .gte('date_iso', historyStart.toISOString().slice(0, 10))
      .order('date_iso', { ascending: true })

    if (logsError) return json({ error: logsError.message }, 400)

    const rows = (logRows ?? []) as SessionLogRow[]

    const { data: profileRow, error: profileError } = await serviceClient
      .from('profiles')
      .select('weekly_sessions')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) return json({ error: profileError.message }, 400)

    const { data: gamificationRow } = await serviceClient
      .from('user_gamification_profile')
      .select(
        'total_xp, level, current_week_streak, longest_week_streak, freeze_used_at, streak_week_start, league_tier',
      )
      .eq('user_id', user.id)
      .maybeSingle()

    const previousXp = gamificationRow?.total_xp ?? 0
    const storedStreak = gamificationRow?.current_week_streak ?? 0
    const storedStreakWeek = gamificationRow?.streak_week_start ?? null

    // Le client ne peut pas gonfler le plan : on borne au plafond dur.
    const plannedDates = Array.isArray(body.plannedSessionDates)
      ? [...new Set(body.plannedSessionDates.map((d) => String(d).slice(0, 10)))]
          .slice(0, SCORE_CAPS.MAX_PLANNED_SESSIONS_PER_WEEK)
      : []

    const scoreInput = deriveWeeklyScoreInput({
      todayISO,
      plannedSessions: plannedDates.map((dateISO) => ({ dateISO })),
      logs: rows.map((row) => ({
        dateISO: row.date_iso,
        sessionType: row.session_type,
        rpe: row.rpe,
        durationMin: row.duration_min,
      })),
      matchDatesISO: Array.isArray(body.matchDates)
        ? body.matchDates.map((d) => String(d).slice(0, 10))
        : [],
      isDeloadWeek: body.isDeloadWeek === true,
      referenceSessionCount:
        body.referenceSessionCount ?? profileRow?.weekly_sessions ?? 3,
      acwrZone: resolveAcwrZone(rows, todayISO),
      priorWeekStreak: priorStreakForWeek(storedStreak, storedStreakWeek, monday),
    })

    const score = computeWeeklyScore(scoreInput)

    const { error: scoreError } = await serviceClient
      .from('gamification_weekly_scores')
      .upsert(
        {
          user_id: user.id,
          week_start: score.weekStartISO,
          points: score.points,
          sessions_planned: score.sessionsPlanned,
          sessions_completed: score.sessionsCompleted,
          deload_respected: score.deloadRespected,
          acwr_capped: score.acwrCapped,
          breakdown: score.breakdown,
        },
        { onConflict: 'user_id,week_start' },
      )

    if (scoreError) return json({ error: scoreError.message }, 400)

    // XP totale = somme des semaines. Recalculée depuis la table plutôt
    // qu'incrémentée, pour qu'un recalcul de semaine ne double jamais l'XP.
    const { data: allScores, error: sumError } = await serviceClient
      .from('gamification_weekly_scores')
      .select('points, week_start, sessions_planned, sessions_completed')
      .eq('user_id', user.id)

    if (sumError) return json({ error: sumError.message }, 400)

    const totalXp = (allScores ?? []).reduce(
      (sum, row) => sum + (row.points ?? 0),
      0,
    )
    const level = resolveLevel(totalXp)

    const planFullyRespected =
      score.sessionsPlanned > 0 &&
      score.breakdown.fullPlanBonus > 0

    const streak = resolveWeekStreak({
      weekStartISO: monday,
      planFullyRespected,
      currentWeekStreak: priorStreakForWeek(storedStreak, storedStreakWeek, monday),
      longestWeekStreak: gamificationRow?.longest_week_streak ?? 0,
      freezeUsedAt: gamificationRow?.freeze_used_at ?? null,
    })

    const { error: upsertError } = await serviceClient
      .from('user_gamification_profile')
      .upsert(
        {
          user_id: user.id,
          total_xp: totalXp,
          level,
          current_week_streak: streak.currentWeekStreak,
          longest_week_streak: streak.longestWeekStreak,
          freeze_used_at: streak.freezeUsedAt,
          streak_week_start: monday,
          league_tier: gamificationRow?.league_tier ?? 'reserve',
        },
        { onConflict: 'user_id' },
      )

    if (upsertError) return json({ error: upsertError.message }, 400)

    // Un passage de palier est un événement réel : il mérite une célébration.
    if (hasLeveledUp(previousXp, totalXp)) {
      await serviceClient.from('social_nudges').insert({
        user_id: user.id,
        kind: 'level_up',
        payload: { level },
      })
    }

    return json({
      ok: true,
      score,
      profile: {
        totalXp,
        level,
        currentWeekStreak: streak.currentWeekStreak,
        longestWeekStreak: streak.longestWeekStreak,
        freezeConsumed: streak.freezeConsumed,
      },
    })
  } catch (error) {
    await captureEdgeException(error, { function: 'recompute-gamification' })
    return json({ error: String(error) }, 500)
  }
})
