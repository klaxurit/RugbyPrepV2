import { useState, useRef, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Send, Bot, Zap, Lock } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { posthog } from '../services/analytics/posthog'
import { useProfile } from '../hooks/useProfile'
import { useWeek } from '../hooks/useWeek'
import { useFatigue } from '../hooks/useFatigue'
import { useHistory } from '../hooks/useHistory'
import { useACWR } from '../hooks/useACWR'
import { useEntitlements } from '../hooks/useEntitlements'
import { usePremiumCheckout } from '../hooks/usePremiumCheckout'
import { getPhaseForWeek } from '../services/program/programPhases.v1'
import { supabase } from '../services/supabase/client'
import { BottomNav } from '../components/BottomNav'

// ─── Types ────────────────────────────────────────────────────

interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  error?: boolean
}

const PHASE_LABELS: Record<string, string> = {
  HYPERTROPHY: 'Hypertrophie',
  FORCE: 'Force',
  POWER: 'Puissance',
}

// ─── Quick prompts ────────────────────────────────────────────

const QUICK_PROMPTS_BASE = [
  'Nutrition avant la séance',
  'Récupération post-match',
  'Sommeil et performance',
  'Prévenir les blessures rugby',
]

const QUICK_PROMPTS_BY_PHASE: Record<string, string> = {
  HYPERTROPHY: 'Conseils nutrition en phase volume',
  FORCE: 'Récupération entre séances lourdes',
  POWER: 'Activation neuromusculaire pré-séance',
}

const QUICK_PROMPT_DELOAD = 'Que faire concrètement en semaine de décharge ?'

// ─── Component ───────────────────────────────────────────────

export function ChatPage() {
  const { profile } = useProfile()
  const { week } = useWeek()
  const { fatigue } = useFatigue()
  const { logs } = useHistory()
  const { acwr, zone: acwrZone, acuteLoad, chronicLoad } = useACWR(logs)
  const { hasEntitlement, isPremium, refresh: refreshEntitlements } = useEntitlements()
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    loading: checkoutLoading,
    error: checkoutError,
    message: checkoutMessage,
    startCheckout,
  } = usePremiumCheckout()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activationSyncing, setActivationSyncing] = useState(false)
  const [activationSyncTimeout, setActivationSyncTimeout] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const phase = getPhaseForWeek(week === 'DELOAD' ? week : week)
  const phaseLabel = phase ? PHASE_LABELS[phase] : null
  const isDeload = week === 'DELOAD'
  const hasPremiumInsights = hasEntitlement('premium_analytics') || hasEntitlement('premium_program_adaptations')
  const checkoutStatus = searchParams.get('checkout')
  const checkoutSessionId = searchParams.get('session_id')
  const isCheckoutSuccess = checkoutStatus === 'success'

  // Build coach context from current state
  const context = useMemo(() => ({
    week,
    phase: phase ?? undefined,
    acwr,
    acwrZone,
    acuteLoad,
    chronicLoad,
    fatigue,
    recentLogs: logs.slice(0, 5).map((l) => ({
      sessionType: l.sessionType,
      rpe: l.rpe,
      durationMin: l.durationMin,
      dateISO: l.dateISO,
      week: l.week,
    })),
    profile: {
      level: profile.level,
      weeklySessions: profile.weeklySessions,
      position: profile.position ?? profile.rugbyPosition,
      injuries: profile.injuries,
    },
  }), [week, phase, acwr, acwrZone, acuteLoad, chronicLoad, fatigue, logs, profile])

  // Quick prompts based on context
  const quickPrompts = useMemo(() => {
    const prompts = [...QUICK_PROMPTS_BASE]
    if (hasPremiumInsights) {
      if (isDeload) prompts.unshift(QUICK_PROMPT_DELOAD)
      else if (phase && QUICK_PROMPTS_BY_PHASE[phase]) prompts.unshift(QUICK_PROMPTS_BY_PHASE[phase])
    }
    return prompts.slice(0, 5)
  }, [hasPremiumInsights, phase, isDeload])

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Après un retour checkout=success, on synchronise les droits côté serveur
  // quelques secondes (le webhook Stripe peut arriver après la redirection client).
  useEffect(() => {
    if (!isCheckoutSuccess || isPremium) return

    let cancelled = false
    setActivationSyncing(true)
    setActivationSyncTimeout(false)

    let attempts = 0
    const maxAttempts = 12
    let timer: number | null = null

    const tick = async () => {
      if (checkoutSessionId) {
        await supabase.functions.invoke('sync-checkout-session', {
          body: { sessionId: checkoutSessionId },
        })
      }
      await refreshEntitlements()
      attempts += 1
      if (cancelled) return
      if (attempts >= maxAttempts) {
        setActivationSyncing(false)
        setActivationSyncTimeout(true)
        return
      }
      timer = window.setTimeout(() => {
        void tick()
      }, 2500)
    }

    void tick()

    return () => {
      cancelled = true
      if (timer !== null) window.clearTimeout(timer)
    }
  }, [checkoutSessionId, isCheckoutSuccess, isPremium, refreshEntitlements])

  useEffect(() => {
    if (!isCheckoutSuccess || !isPremium) return

    setActivationSyncing(false)
    setActivationSyncTimeout(false)

    const next = new URLSearchParams(searchParams)
    next.delete('checkout')
    next.delete('session_id')
    setSearchParams(next, { replace: true })
  }, [isCheckoutSuccess, isPremium, searchParams, setSearchParams])

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    posthog.capture('chat_used', { firstMessage: messages.length === 0 })

    const userMsg: ChatMessage = { id: Date.now(), role: 'user', content: trimmed }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      // Pass full conversation history to the Edge Function
      const { data, error } = await supabase.functions.invoke('ai-coach', {
        body: {
          useCase: 'free_chat',
          userMessage: trimmed,
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          context,
        },
      })

      if (error) throw error

      const responseText: string = data?.error
        ? `Erreur : ${data.error}`
        : (data?.message ?? 'Pas de réponse.')

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'assistant', content: responseText, error: !!data?.error },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'assistant', content: 'Erreur réseau — réessaie.', error: true },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="min-h-screen bg-[#1a100c] font-sans text-white flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.025] bg-[radial-gradient(#ff6b35_1px,transparent_1px)] [background-size:20px_20px]" />

      <PageHeader
        title="Coach IA"
        backTo="/"
        right={
          <>
            {(phaseLabel || isDeload) && (
              <span className="px-2.5 py-1 rounded-full bg-white/10 text-[10px] font-black text-white/50 tracking-wide">
                {isDeload ? 'DÉCHARGE' : phaseLabel?.toUpperCase()}
              </span>
            )}
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide ${
                isPremium ? 'bg-[#ff6b35]/15 text-[#ff6b35]' : 'bg-white/10 text-white/45'
              }`}
            >
              {isPremium ? 'PREMIUM' : 'FREE'}
            </span>
          </>
        }
      />

      {/* Messages area */}
      <main className="relative flex-1 overflow-y-auto px-4 pt-5 pb-32 space-y-4 max-w-md mx-auto w-full">

        {/* Welcome state */}
        {messages.length === 0 && (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-2xl bg-[#ff6b35] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-[1.5rem] rounded-tl-md px-4 py-3 max-w-[85%]">
                <p className="text-sm text-white/80 leading-relaxed">
                  Salut ! Je suis ton coach IA RugbyForge 🏉
                </p>
                <p className="text-sm text-white/80 leading-relaxed mt-1.5">
                  Pose-moi n'importe quelle question sur l'entraînement, la nutrition, la récupération ou le sommeil. Je connais ton profil et ta semaine en cours.
                </p>
                {!hasPremiumInsights && (
                  <p className="text-xs text-white/45 mt-2 leading-relaxed">
                    Mode Free: le coach reste disponible, mais les suggestions contextuelles avancées sont réservées au Premium.
                  </p>
                )}
                {context.week && (
                  <p className="text-xs text-white/40 mt-2">
                    Semaine {context.week}{phaseLabel ? ` · Phase ${phaseLabel}` : ''}{context.fatigue ? ` · Fatigue : ${context.fatigue}` : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Quick prompts */}
            <div className="space-y-2 pl-11">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Suggestions</p>
              <div className="flex flex-col gap-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="flex items-center gap-2.5 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-left hover:border-[#ff6b35]/30 hover:bg-[#ff6b35]/5 transition-colors group"
                  >
                    <Zap className="w-3.5 h-3.5 text-[#ff6b35] flex-shrink-0" />
                    <span className="text-sm font-medium text-white/70 group-hover:text-white">{prompt}</span>
                  </button>
                ))}
              </div>
            </div>

            {!isPremium && (
              <div className="pl-11">
                <div className="rounded-[1.5rem] border border-[#ff6b35]/20 bg-[#ff6b35]/[0.06] p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-2xl bg-[#ff6b35]/15">
                      <Lock className="h-4 w-4 text-[#ff6b35]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-white">Passe en Premium</p>
                      <p className="mt-1 text-xs leading-relaxed text-white/60">
                        Débloque les suggestions avancées liées à ta phase, à ta charge et à tes adaptations de programme.
                      </p>
                      {isCheckoutSuccess && (
                        <p className="mt-2 text-[11px] leading-relaxed text-[#ffb08f]">
                          {activationSyncing
                            ? 'Paiement confirmé. Activation Premium en cours...'
                            : activationSyncTimeout
                              ? 'Activation encore en attente. Clique sur vérifier ou consulte les logs webhook Stripe.'
                              : 'Retour de paiement détecté.'}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (isCheckoutSuccess) {
                            void refreshEntitlements()
                            return
                          }
                          void startCheckout('premium_monthly')
                        }}
                        disabled={checkoutLoading}
                        className="mt-3 inline-flex items-center justify-center rounded-2xl bg-[#ff6b35] px-4 py-2 text-xs font-black text-white transition-colors hover:bg-[#e55a2b] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {checkoutLoading
                          ? 'Chargement...'
                          : isCheckoutSuccess
                            ? 'Vérifier mon statut Premium'
                            : 'Activer Premium'}
                      </button>
                      {checkoutMessage && (
                        <p className="mt-2 text-[11px] leading-relaxed text-[#ffb08f]">
                          {checkoutMessage}
                        </p>
                      )}
                      {checkoutError && (
                        <p className="mt-2 text-[11px] leading-relaxed text-amber-300">
                          {checkoutError}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-xl bg-[#ff6b35] flex items-center justify-center flex-shrink-0 mb-0.5">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div
              className={`max-w-[82%] px-4 py-3 rounded-[1.5rem] ${
                msg.role === 'user'
                  ? 'bg-[#ff6b35] text-white rounded-br-md'
                  : msg.error
                    ? 'bg-amber-900/20 border border-amber-500/20 text-amber-300 rounded-tl-md'
                    : 'bg-white/5 border border-white/10 text-white/80 rounded-tl-md'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex items-end gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-xl bg-[#ff6b35] flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-[1.5rem] rounded-tl-md px-4 py-3">
              <div className="flex gap-1.5 items-center h-4">
                <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      {/* Input area — sits just above BottomNav */}
      <div className="sticky bottom-20 bg-[#1a100c]/95 backdrop-blur border-t border-white/10 px-4 py-3">
        <div className="max-w-md mx-auto flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pose ta question..."
            rows={1}
            className="flex-1 resize-none bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#ff6b35] focus:ring-1 focus:ring-[#ff6b35]/20 max-h-28 leading-relaxed"
            style={{ overflow: 'auto' }}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-2xl bg-[#ff6b35] flex items-center justify-center flex-shrink-0 hover:bg-[#e55a2b] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-center text-[10px] text-white/25 mt-2">
          Conseils sportifs uniquement — pas un avis médical
        </p>
      </div>

      <BottomNav />
    </div>
  )
}
