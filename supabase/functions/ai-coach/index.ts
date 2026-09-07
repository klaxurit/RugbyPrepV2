import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { captureEdgeException } from '../_shared/sentry.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FREE_DAILY_LIMIT = 3

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AICoachRequest {
  useCase: 'deload_explain' | 'session_advice' | 'free_chat'
  userMessage?: string
  messages?: ChatMessage[]
  context: {
    week?: string
    phase?: string
    acwr?: number | null
    acwrZone?: string | null
    acuteLoad?: number
    chronicLoad?: number
    fatigue?: string
    recentLogs?: Array<{
      sessionType: string
      rpe?: number
      durationMin?: number
      dateISO: string
      week: string
    }>
    profile?: {
      level?: string
      weeklySessions?: number
      position?: string
      injuries?: string[]
    }
    nextMatch?: {
      date: string
      opponent?: string | null
      daysUntil?: number | null
    } | null
  }
}

// ─── Supabase admin client (service role) ───────────────────

function getAdminClient() {
  const url = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  return createClient(url, serviceKey)
}

// ─── Auth helper ────────────────────────────────────────────

async function authenticateUser(req: Request): Promise<{ userId: string } | Response> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const token = authHeader.replace('Bearer ', '')
  const url = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const { data: { user }, error } = await userClient.auth.getUser()
  if (error || !user) {
    return new Response(
      JSON.stringify({ error: 'unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return { userId: user.id }
}

// ─── Premium check ──────────────────────────────────────────

async function checkPremium(admin: ReturnType<typeof getAdminClient>, userId: string): Promise<boolean> {
  try {
    const { data } = await admin
      .from('user_entitlements')
      .select('entitlement_key')
      .eq('user_id', userId)
      .eq('status', 'active')
      .in('entitlement_key', ['premium_program_adaptations', 'premium_analytics'])
      .limit(1)
    return (data?.length ?? 0) > 0
  } catch {
    // Fail-safe: treat as Free
    return false
  }
}

// ─── Rate limiting (Free only) ──────────────────────────────

async function checkAndIncrementUsage(
  admin: ReturnType<typeof getAdminClient>,
  userId: string
): Promise<{ allowed: boolean; messageCount: number; limiterUnavailable?: boolean }> {
  try {
    const { data, error } = await admin.rpc('increment_ai_coach_usage', {
      p_user_id: userId,
    })

    if (error) {
      // Fail-closed : sans compteur fiable, on refuse plutôt que d’ouvrir un appel Anthropic illimité (coût / abus).
      console.error('ai_coach_usage RPC failed (fail-closed):', error.message)
      return { allowed: false, messageCount: 0, limiterUnavailable: true }
    }

    const count = Math.max(0, typeof data === 'number' ? data : 0)
    return { allowed: count <= FREE_DAILY_LIMIT, messageCount: count }
  } catch (err) {
    console.error('Rate limit check failed (fail-closed):', err)
    return { allowed: false, messageCount: 0, limiterUnavailable: true }
  }
}

function firstNameFromDisplayName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const token = raw.trim().split(/\s+/)[0]
  if (!token || token.length > 40) return null
  return token
}

async function loadFirstName(
  admin: ReturnType<typeof getAdminClient>,
  userId: string,
): Promise<string | null> {
  try {
    const { data } = await admin.from('profiles').select('display_name').eq('id', userId).maybeSingle()
    return firstNameFromDisplayName(data?.display_name)
  } catch {
    return null
  }
}

function acwrZoneFr(zone: string | null | undefined): string | null {
  if (!zone) return null
  const map: Record<string, string> = {
    underload: 'sous-entraînement',
    optimal: 'optimal',
    caution: 'vigilance',
    danger: 'danger',
    critical: 'critique',
    'sous-entraînement': 'sous-entraînement',
    vigilance: 'vigilance',
  }
  return map[zone] ?? zone
}

function daysBetweenISO(fromISO: string, toISO: string): number | null {
  const parse = (s: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
    if (!m) return null
    return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  }
  const from = parse(fromISO)
  const to = parse(toISO)
  if (from == null || to == null) return null
  return Math.round((to - from) / 86_400_000)
}

function matchFactLines(
  dateISO: string,
  opponent?: string | null,
  daysUntil?: number | null,
): string[] {
  const todayISO = new Date().toISOString().split('T')[0]
  const days = daysUntil ?? daysBetweenISO(todayISO, dateISO)
  const vs = opponent ? ` vs ${opponent}` : ''
  if (days == null) return [`- Prochain match : ${dateISO}${vs}`]
  if (days === 0) return [`- Match aujourd’hui${vs}.`]
  if (days === 1) return [`- Match demain (J-1)${vs}. Pas de lourd.`]
  if (days === 2) {
    return [
      `- Aujourd’hui = J-2 du match${vs}. Séance light, pas de lourd (≤2 blocs). Ce n’est pas une décharge.`,
    ]
  }
  return [
    `- Prochain match : ${dateISO}${vs} (dans ${days} jours). Le J-2 n’est pas maintenant — n’en parle que si on te le demande.`,
  ]
}

function clockBlock(ctx: AICoachRequest['context'], firstName: string | null): string {
  const lines: string[] = [
    '\nFaits joueur (déjà connus : personnalise si ça aide, ne les récite pas à chaque message, ne les redemande pas) :',
  ]
  if (firstName) lines.push(`- Prénom : ${firstName}`)
  if (ctx.week) lines.push(`- Semaine : ${ctx.week}`)
  if (ctx.phase) lines.push(`- Orientation S&C : ${ctx.phase}`)
  if (ctx.fatigue) lines.push(`- Fatigue déclarée : ${ctx.fatigue}`)
  if (ctx.acwr != null) {
    const zone = acwrZoneFr(ctx.acwrZone) ?? ctx.acwrZone ?? '?'
    lines.push(`- ACWR (calcul app) : ${ctx.acwr} (zone ${zone})`)
  } else {
    lines.push('- ACWR : pas encore assez de séances loggées')
  }
  if (ctx.nextMatch?.date) {
    lines.push(...matchFactLines(
      ctx.nextMatch.date,
      ctx.nextMatch.opponent,
      ctx.nextMatch.daysUntil,
    ))
  }
  lines.push('- Pas de détail de la séance club dans ces faits.')
  return lines.join('\n')
}

// ─── Premium profile context (server-side, never from client) ─

async function buildPremiumContext(
  admin: ReturnType<typeof getAdminClient>,
  userId: string
): Promise<{ text: string; firstName: string | null }> {
  try {
    const [profileRes, acwrRes, logsRes] = await Promise.all([
      admin.from('profiles').select('display_name, position, training_level, season_mode, injuries').eq('id', userId).single(),
      admin.from('session_logs').select('acute_load, chronic_load, acwr_value').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      admin.from('exercise_logs').select('exercise_id, weight, reps, rpe, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(15),
    ])

    const profile = profileRes.data
    const acwr = acwrRes.data
    const logs = logsRes.data ?? []

    const lines: string[] = ['\nPROFIL JOUEUR (contexte personnalisé) :']
    const firstName = firstNameFromDisplayName(profile?.display_name)
    if (firstName) lines.push(`- Prénom : ${firstName}`)

    if (profile) {
      lines.push(`- Poste : ${profile.position ?? '?'}, Niveau : ${profile.training_level ?? '?'}, Saison : ${profile.season_mode ?? '?'}`)
      if (profile.injuries?.length) {
        lines.push(`- Déclaré par le joueur (pas un diagnostic) : ${(profile.injuries as string[]).join(', ')}`)
      }
    }

    if (acwr) {
      const acwrValue = acwr.acwr_value ?? (acwr.chronic_load ? (acwr.acute_load / acwr.chronic_load).toFixed(2) : null)
      const zone = acwrValue
        ? Number(acwrValue) > 1.5 ? 'danger' : Number(acwrValue) > 1.3 ? 'vigilance' : Number(acwrValue) >= 0.8 ? 'optimal' : 'sous-entraînement'
        : 'N/A'
      lines.push(`- ACWR actuel : ${acwrValue ?? 'N/A'} (zone : ${zone})`)
    }

    if (logs.length > 0) {
      const summary = logs.slice(0, 10).map((l: Record<string, unknown>) =>
        `${l.exercise_id} ${l.weight ?? 'BW'}kg×${l.reps} RPE${l.rpe ?? '?'}`
      ).join(', ')
      lines.push(`- Derniers exercices loggés : ${summary}`)
    }

    lines.push('')
    lines.push('Ces faits aident à personnaliser. Ne les récite pas en ouverture. N’invente ni kg, ni 1RM, ni match, ni blessure absents.')

    return { text: lines.join('\n'), firstName }
  } catch (err) {
    console.error('Failed to build premium context:', err)
    return { text: '', firstName: null }
  }
}

// ─── System prompt ───────────────────────────────────────────

const BASE_SYSTEM_PROMPT = `Tu es le coach S&C de RugbyForge. Amateur FFR : club + 2–3 séances salle. L’app a déjà le programme.

Rôle
Tu aiguilles et tu éclaires les doutes (force, charge, récup, nutrition, sommeil, saison, match, lecture du programme). Champ large : réponds à la question posée. Tu n’es pas limité à la charge de la semaine.

Interdit
- Inventer ou réécrire une séance (pas de proto, pas de liste d’exos / séries / %). Oriente vers le programme de l’app.
- Avis médical, diagnostic, protocole rehab. Douleur thoracique, malaise, commotion, pop articulaire → arrêter et voir un pro.
- Inventer kg, 1RM, match ou blessure absents des faits.

Repères produit (seulement si la question s’y rattache)
- Un match : celui du calendrier. Pas de protocole « 2 matchs ».
- J-2 : light, pas de lourd, ≤2 blocs. Ce n’est pas une décharge. N’en parle que si les faits disent que c’est J-2 / J-1, ou si le joueur pose la question.
- Décharge prévue par l’app : −40 % de volume, intensité inchangée.
- Effort : RER (pas RIR). 2–3 jours salle, pas un 4e par défaut.

Écriture
Tutoiement, français, texte brut (pas de markdown, pas d’emoji). Zones ACWR en français (sous-entraînement, optimal, vigilance, danger). Longueur = ce qu’il faut pour être clair. Une question de clarification est OK si un fait manque ; pas de questionnaire sur ce qui est déjà dans les faits.`

function buildSystemPromptFree(ctx: AICoachRequest['context'], firstName: string | null): string {
  return BASE_SYSTEM_PROMPT + clockBlock(ctx, firstName)
}

function buildSystemPromptPremium(
  premiumContext: string,
  ctx: AICoachRequest['context'],
  firstName: string | null,
): string {
  return BASE_SYSTEM_PROMPT + premiumContext + clockBlock(ctx, firstName)
}

// ─── Prompt builders ─────────────────────────────────────────

function buildDeloadPrompt(req: AICoachRequest): string {
  const ctx = req.context
  const acwrInfo = ctx.acwr != null
    ? `ACWR : ${ctx.acwr} (${ctx.acwrZone}). Charge aiguë : ${ctx.acuteLoad} UA, chronique : ${ctx.chronicLoad} UA.`
    : 'Pas encore de données ACWR suffisantes.'

  const logsInfo = ctx.recentLogs?.length
    ? `Séances récentes : ${ctx.recentLogs.slice(0, 5).map(l => `${l.sessionType} RPE${l.rpe ?? '?'} ${l.durationMin ?? '?'}min`).join(' | ')}`
    : 'Aucune séance récente.'

  return `L'app recommande une décharge (−40 % volume, intensité inchangée). Données : semaine ${ctx.week ?? '?'}, fatigue "${ctx.fatigue ?? '?'}", ${acwrInfo} ${logsInfo}. Explique pourquoi en 2 phrases et donne 1 conseil concret pour cette semaine.`
}

function buildSessionAdvicePrompt(req: AICoachRequest): string {
  const ctx = req.context
  return `Conseil pré-séance : semaine ${ctx.week ?? '?'}, fatigue "${ctx.fatigue ?? '?'}", ACWR ${ctx.acwr ?? 'N/A'} (${ctx.acwrZone ?? 'N/A'}), dernières séances : ${ctx.recentLogs?.slice(0, 3).map(l => `RPE${l.rpe}×${l.durationMin}min`).join(' ') ?? 'aucune'}. Donne 1-2 conseils pratiques pour optimiser la séance.`
}

// ─── JSON response helper ────────────────────────────────────

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// ─── Build Anthropic messages from request ───────────────────

function buildAnthropicMessages(body: AICoachRequest): ChatMessage[] {
  if (body.useCase === 'free_chat' && body.messages && body.messages.length > 0) {
    return body.messages.slice(-10)
  }
  if (body.useCase === 'deload_explain') {
    return [{ role: 'user', content: buildDeloadPrompt(body) }]
  }
  if (body.useCase === 'session_advice') {
    return [{ role: 'user', content: buildSessionAdvicePrompt(body) }]
  }
  return [{ role: 'user', content: body.userMessage ?? 'Bonjour, comment tu peux m\'aider ?' }]
}

// ─── Call Anthropic API ──────────────────────────────────────

async function callAnthropic(
  apiKey: string,
  systemPrompt: string,
  messages: ChatMessage[]
): Promise<{ message: string; error?: string }> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: systemPrompt,
      messages,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    return { message: '', error: `Anthropic ${response.status}: ${err}` }
  }

  const data = await response.json()
  return { message: data.content?.[0]?.text ?? '' }
}

// ─── Handler ─────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return jsonResponse({ error: 'ANTHROPIC_API_KEY not configured' }, 500)
    }

    // 1. Authenticate user
    const authResult = await authenticateUser(req)
    if (authResult instanceof Response) return authResult
    const { userId } = authResult

    // 2. Parse body (once)
    const body: AICoachRequest = await req.json()
    const admin = getAdminClient()

    // 3. Check Premium status
    const isPremium = await checkPremium(admin, userId)

    // 4. Rate limiting (Free only)
    let remaining: number | undefined
    if (!isPremium) {
      const usage = await checkAndIncrementUsage(admin, userId)
      if (!usage.allowed) {
        if (usage.limiterUnavailable) {
          return jsonResponse(
            { error: 'usage_counter_unavailable', limited: false },
            503,
          )
        }
        return jsonResponse({ error: 'rate_limited', limited: true, remaining: 0 }, 429)
      }
      remaining = Math.max(0, FREE_DAILY_LIMIT - usage.messageCount)
    }

    // 5. Build system prompt
    let systemPrompt: string
    if (isPremium) {
      const premium = await buildPremiumContext(admin, userId)
      systemPrompt = buildSystemPromptPremium(premium.text, body.context, premium.firstName)
    } else {
      const firstName = await loadFirstName(admin, userId)
      systemPrompt = buildSystemPromptFree(body.context, firstName)
    }

    // 6. Call Anthropic
    const anthropicMessages = buildAnthropicMessages(body)
    const result = await callAnthropic(apiKey, systemPrompt, anthropicMessages)

    if (result.error) {
      return jsonResponse({ error: result.error })
    }

    const responseBody: Record<string, unknown> = { message: result.message, limited: false }
    if (remaining !== undefined) {
      responseBody.remaining = remaining
    }

    return jsonResponse(responseBody)
  } catch (error) {
    await captureEdgeException(error, { function: 'ai-coach' })
    return jsonResponse({ error: String(error) }, 500)
  }
})
