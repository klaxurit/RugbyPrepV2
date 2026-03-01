import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AICoachRequest {
  useCase: 'deload_explain' | 'session_advice' | 'free_chat'
  userMessage?: string
  messages?: ChatMessage[]   // conversation history for multi-turn chat
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

// ─── System prompt ───────────────────────────────────────────

function buildSystemPrompt(ctx: AICoachRequest['context']): string {
  const profileLine = ctx.profile
    ? `Profil athlète : niveau ${ctx.profile.level ?? '?'}, ${ctx.profile.weeklySessions ?? '?'} séances/sem, poste : ${ctx.profile.position ?? '?'}${ctx.profile.injuries?.length ? `, zones sensibles : ${ctx.profile.injuries.join(', ')}` : ''}.`
    : ''

  const contextLine = ctx.week
    ? `Semaine actuelle : ${ctx.week}${ctx.phase ? ` (phase ${ctx.phase})` : ''}, fatigue déclarée : ${ctx.fatigue ?? '?'}, ACWR : ${ctx.acwr != null ? ctx.acwr : 'insuffisant'} (${ctx.acwrZone ?? 'N/A'}).`
    : ''

  return `Tu es RugbyCoach IA, coach de préparation physique rugby spécialisé pour les joueurs amateurs.

${profileLine}
${contextLine}

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

// ─── Handler ─────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body: AICoachRequest = await req.json()

    // Build Anthropic messages array
    let anthropicMessages: ChatMessage[]

    if (body.useCase === 'free_chat' && body.messages && body.messages.length > 0) {
      // Multi-turn chat: use full conversation history (last 10 messages)
      anthropicMessages = body.messages.slice(-10)
    } else if (body.useCase === 'deload_explain') {
      anthropicMessages = [{ role: 'user', content: buildDeloadPrompt(body) }]
    } else if (body.useCase === 'session_advice') {
      anthropicMessages = [{ role: 'user', content: buildSessionAdvicePrompt(body) }]
    } else {
      anthropicMessages = [{ role: 'user', content: body.userMessage ?? 'Bonjour, comment tu peux m\'aider ?' }]
    }

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
        system: buildSystemPrompt(body.context),
        messages: anthropicMessages,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return new Response(
        JSON.stringify({ error: `Anthropic ${response.status}: ${err}` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    const message: string = data.content?.[0]?.text ?? ''

    return new Response(
      JSON.stringify({ message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
