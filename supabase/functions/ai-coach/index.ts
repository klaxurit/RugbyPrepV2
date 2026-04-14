import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

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
): Promise<{ allowed: boolean; messageCount: number }> {
  try {
    const { data, error } = await admin.rpc('increment_ai_coach_usage', {
      p_user_id: userId,
    })

    if (error) {
      // Table or function might not exist — fail-open
      console.error('ai_coach_usage RPC failed (fail-open):', error.message)
      return { allowed: true, messageCount: 0 }
    }

    const count = Math.max(0, typeof data === 'number' ? data : 0)
    return { allowed: count <= FREE_DAILY_LIMIT, messageCount: count }
  } catch (err) {
    // Fail-open: if anything goes wrong, allow the request
    console.error('Rate limit check failed (fail-open):', err)
    return { allowed: true, messageCount: 0 }
  }
}

// ─── Premium profile context (server-side, never from client) ─

async function buildPremiumContext(
  admin: ReturnType<typeof getAdminClient>,
  userId: string
): Promise<string> {
  try {
    const [profileRes, acwrRes, logsRes, matchRes] = await Promise.all([
      admin.from('profiles').select('position, training_level, season_mode, injuries').eq('id', userId).single(),
      admin.from('session_logs').select('acute_load, chronic_load, acwr_value').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      admin.from('exercise_logs').select('exercise_id, weight, reps, rpe, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(15),
      admin.from('match_calendar').select('date, kickoff_time, opponent, is_home').eq('user_id', userId).gte('date', new Date().toISOString().split('T')[0]).order('date', { ascending: true }).limit(1).maybeSingle(),
    ])

    const profile = profileRes.data
    const acwr = acwrRes.data
    const logs = logsRes.data ?? []
    const match = matchRes.data

    const lines: string[] = ['\nPROFIL JOUEUR (contexte personnalisé) :']

    if (profile) {
      lines.push(`- Poste : ${profile.position ?? '?'}, Niveau : ${profile.training_level ?? '?'}, Saison : ${profile.season_mode ?? '?'}`)
      if (profile.injuries?.length) {
        lines.push(`- Blessures actives : ${(profile.injuries as string[]).join(', ')}`)
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

    if (match) {
      lines.push(`- Prochain match : ${match.date}${match.kickoff_time ? ` ${match.kickoff_time}` : ''} vs ${match.opponent ?? '?'}${match.is_home ? ' (domicile)' : ' (extérieur)'}`)
    }

    lines.push('')
    lines.push('INSTRUCTION : Tu connais ce joueur personnellement. Chaque réponse doit être spécifique à son profil, sa charge actuelle et ses contraintes. Utilise ses données pour personnaliser tes conseils.')

    return lines.join('\n')
  } catch (err) {
    console.error('Failed to build premium context:', err)
    return '' // Graceful degradation: Premium without personalization
  }
}

// ─── System prompt ───────────────────────────────────────────

const BASE_SYSTEM_PROMPT = `Tu es RugbyCoach IA, coach de préparation physique rugby spécialisé pour les joueurs amateurs.

── Connaissances clés ──
ENTRAÎNEMENT
- Périodisation par blocs : Hypertrophie (H1-4, 65-75% 1RM, 8-12 reps), Force (W1-8, 80-90% 1RM, 3-6 reps), Puissance (contraste, vitesse)
- ACWR optimal 0.8-1.3 ; vigilance 1.3-1.5 ; danger >1.5 (risque blessure ×2, Hulin 2016)
- Décharge : -40-60% volume, 1 semaine, qualité maintenue
- Contraste français, RER/RIR, RPE session = charge perçue

SEMAINE DOUBLE MATCH (2 matchs en 5-7 jours)
- Récupération complète post-match : 72-96h. À J+5-6, capacité musculaire encore à -10-15%
- Priorité absolue J+1 : 1.0-1.2g glucides/kg/h + 20-40g protéines dans 30 min + 8-9h sommeil
- Interdiction séance force ≥70% 1RM dans les 72h précédant le 2e match
- ACWR peut monter à 1.5-1.8 : acceptable si charge chronique établie ≥400 UA/sem
- J+1 : récupération active vélo léger 20 min + bain froid 10-15°C optionnel
- Suppléments utiles : cerises Montmorency (Bell 2015), oméga-3, caféine J match 2
- Si J0→J6 : 1 séance force légère possible à J3 (60-70% 1RM, 1 bloc)
- Stop-signal match 2 : DOMS >6/10 + sommeil <12h total + force très réduite → moduler temps de jeu

NUTRITION RUGBY
- Avant séance (2-3h) : glucides complexes (riz, pâtes, patate douce) + protéines légères. 1h avant : banane, fruit sec.
- Pendant (>60 min) : eau + électrolytes, 30-60g glucides/h si intensité haute
- Après séance (<30 min) : 20-40g protéines + glucides (ratio 1:3). Fenêtre anabolique réelle mais non magique.
- Jour de match : repas habituel 3-4h avant, éviter aliments nouveaux. Récupération post-match : protéines + glucides dans l'heure.
- Apports journaliers rugby : 1.6-2.2g protéines/kg/j, glucides selon charge (3-7g/kg/j)
- Créatine : 3-5g/j, preuve A1 pour force/puissance, safe long terme
- Caféine : 3-6mg/kg, 60 min avant, améliore force et endurance

RÉCUPÉRATION & SOMMEIL
- Sommeil : 8-9h recommandé pour athlètes. <6h = récupération musculaire réduite, risque blessure ×1.7 (Milewski 2014)
- Sommeil profond (SWP) = sécrétion GH maximale = synthèse protéique
- Stratégies récupération : bains froids (10-15°C, 10-15 min), compression, nutrition, sommeil > tout le reste
- HRV : marqueur sensible de récupération SNC. Baisse HRV + fatigue = réduire intensité
- Surmenage : 3 signes : performance stagnante/chute + fatigue chronique + motivation basse

PRÉVENTION BLESSURES RUGBY
- Mêlée : renforcement cervical isométrique obligatoire, gainage profond
- Genoux : contrôle valgus, renfort VMO et moyen fessier
- Ischios : Nordic curls, RDL (blessure musculaire la plus fréquente en rugby)
- Épaules : rotation externe, face pull, Y-T-W — avant chaque séance upper

── Règles de réponse ──
- TOUJOURS en français
- Concis et actionnable — max 4-5 phrases par réponse dans un chat
- Si question complexe, structure avec 2-3 points clés max
- Chiffres et références quand pertinent (pas systématique)
- Format direct, sans formules de politesse vides
- Tu n'es PAS médecin. Douleur persistante → consulter professionnel de santé.
- Parler d'"inconforts" ou "précautions", jamais de "diagnostic médical"`

function buildSystemPromptFree(ctx: AICoachRequest['context']): string {
  // Free: generic KB only, no personal profile data from client context
  const contextLine = ctx.week
    ? `\nSemaine actuelle : ${ctx.week}${ctx.phase ? ` (phase ${ctx.phase})` : ''}.`
    : ''
  return BASE_SYSTEM_PROMPT + contextLine
}

function buildSystemPromptPremium(premiumContext: string): string {
  return BASE_SYSTEM_PROMPT + premiumContext
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

  return `L'app recommande une décharge. Données : semaine ${ctx.week ?? '?'}, fatigue "${ctx.fatigue ?? '?'}", ${acwrInfo} ${logsInfo}. Explique pourquoi en 2 phrases et donne 1 conseil concret pour cette semaine.`
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
        return jsonResponse({ error: 'rate_limited', limited: true, remaining: 0 }, 429)
      }
      remaining = Math.max(0, FREE_DAILY_LIMIT - usage.messageCount)
    }

    // 5. Build system prompt
    let systemPrompt: string
    if (isPremium) {
      // Premium: server-side DB context, IGNORES client userContext
      const premiumContext = await buildPremiumContext(admin, userId)
      systemPrompt = buildSystemPromptPremium(premiumContext)
    } else {
      // Free: generic KB only
      systemPrompt = buildSystemPromptFree(body.context)
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
    return jsonResponse({ error: String(error) }, 500)
  }
})
