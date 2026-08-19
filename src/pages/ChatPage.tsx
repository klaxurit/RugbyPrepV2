import { useState, useRef, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Send, Bot, Zap, Lock } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { posthog } from '../services/analytics/posthog'
import { useProfile } from '../hooks/useProfile'
import { useFatigue } from '../hooks/useFatigue'
import { useHistory } from '../hooks/useHistory'
import { useACWR } from '../hooks/useACWR'
import { useCalendar } from '../hooks/useCalendar'
import { useFeatureAccess } from '../hooks/useFeatureAccess'
import { usePremiumCheckout } from '../hooks/usePremiumCheckout'
import { useStripeCheckoutReturn } from '../hooks/useStripeCheckoutReturn'
import { buildAthletePlanningInputs } from '../services/annualPlanning/buildAthletePlanningInputs'
import { detectAnnualPlanningContext } from '../services/season/detectAnnualPlanningContext'
import {
  chatPhaseFromPlanning,
  chatWeekLabelFromPlanning,
} from '../services/chat/resolveChatProgramContext'
import { getToday } from '../services/ui/debugDateOverride'
import { supabase } from '../services/supabase/client'
import { FunctionsHttpError } from '@supabase/functions-js'
import { PremiumUpsellCard } from '../components/PremiumUpsellCard'
import { BottomNav } from '../components/BottomNav'
import { tr, type Lang } from '../i18n/appLabels'

// ─── Types ────────────────────────────────────────────────────

interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  error?: boolean
}

function phaseLabelFor(phase: string | null | undefined, lang: Lang): string | null {
  switch (phase) {
    case 'HYPERTROPHY':
      return tr('chat_phase_hypertrophy', lang)
    case 'FORCE':
      return tr('chat_phase_force', lang)
    case 'POWER':
      return tr('chat_phase_power', lang)
    default:
      return null
  }
}

function quickPromptForPhase(phase: string | null | undefined, lang: Lang): string | null {
  switch (phase) {
    case 'HYPERTROPHY':
      return tr('chat_qp_phase_hyper', lang)
    case 'FORCE':
      return tr('chat_qp_phase_force', lang)
    case 'POWER':
      return tr('chat_qp_phase_power', lang)
    default:
      return null
  }
}

// ─── Component ───────────────────────────────────────────────

export function ChatPage() {
  const { profile } = useProfile()
  const { fatigue } = useFatigue()
  const { logs } = useHistory()
  const { events: chatEvents, nextMatch: chatNextMatch } = useCalendar()
  const { acwr, zone: acwrZone, acuteLoad, chronicLoad } = useACWR(logs, chatEvents)
  const { hasEntitlement, isPremium, loading: entitlementsLoading, refresh: refreshEntitlements } = useFeatureAccess()
  const premiumResolved = !entitlementsLoading
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    loading: checkoutLoading,
    error: checkoutError,
    message: checkoutMessage,
    startCheckout,
  } = usePremiumCheckout()

  const {
    isCheckoutSuccess,
    activationSyncing,
    activationSyncTimeout,
  } = useStripeCheckoutReturn(isPremium, refreshEntitlements)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [rateLimited, setRateLimited] = useState(false)
  const [remaining, setRemaining] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Pré-remplit l'input quand on arrive via le compagnon (?seed=…)
  useEffect(() => {
    const seed = searchParams.get('seed')
    if (!seed) return
    if (messages.length === 0 && input.length === 0) {
      setInput(seed)
      inputRef.current?.focus()
    }
    const next = new URLSearchParams(searchParams)
    next.delete('seed')
    setSearchParams(next, { replace: true })
    // On ne dépend que de searchParams : seed consommé une seule fois.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const lang: Lang = (profile.preferredLanguage as Lang | undefined) ?? 'fr'
  const today = useMemo(() => getToday(), [])
  const planningContext = useMemo(() => {
    const { inputs } = buildAthletePlanningInputs({
      profile,
      events: chatEvents,
      logs,
      today,
      fatigue,
      acwrZone,
    })
    return detectAnnualPlanningContext(inputs)
  }, [profile, chatEvents, logs, today, fatigue, acwrZone])
  const week = chatWeekLabelFromPlanning(planningContext, lang)
  const phase = chatPhaseFromPlanning(planningContext)
  const phaseLabel = phaseLabelFor(phase, lang)
  const isDeload = planningContext.isDeloadWeek
  const hasPremiumInsights = hasEntitlement('premium_analytics') || hasEntitlement('premium_program_adaptations')
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
  // Check if match is within 48h for pre-match prompt
  const hasMatchSoon = useMemo(() => {
    if (!chatNextMatch) return false
    const matchDate = new Date(chatNextMatch.date + 'T00:00:00')
    const now = new Date()
    const diffMs = matchDate.getTime() - now.getTime()
    return diffMs >= 0 && diffMs <= 48 * 60 * 60 * 1000
  }, [chatNextMatch])

  const quickPrompts = useMemo(() => {
    const base = [
      tr('chat_qp_nutrition', lang),
      tr('chat_qp_recovery', lang),
      tr('chat_qp_sleep', lang),
      tr('chat_qp_injury', lang),
    ]
    const prompts = [...base]
    if (hasPremiumInsights) {
      if (hasMatchSoon) prompts.unshift(tr('chat_qp_prematch', lang))
      if (isDeload) prompts.unshift(tr('chat_qp_deload', lang))
      else {
        const phaseQp = quickPromptForPhase(phase, lang)
        if (phaseQp) prompts.unshift(phaseQp)
      }
    }
    return prompts.slice(0, 5)
  }, [hasPremiumInsights, phase, isDeload, hasMatchSoon, lang])

  // Auto-scroll uniquement quand une conversation est réellement en cours.
  // Sinon, au premier rendu, on arrive artificiellement en bas de page.
  useEffect(() => {
    if (messages.length === 0 && !loading) return
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, loading])

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

      /** Corps JSON même si le relay renvoie 4xx/5xx (invoke met alors `error` mais pas `data`). */
      let payload = data as Record<string, unknown> | null
      if (error instanceof FunctionsHttpError) {
        try {
          const res = error.context as Response
          const ct = res.headers.get('content-type') ?? ''
          if (ct.includes('application/json')) {
            payload = (await res.json()) as Record<string, unknown>
          }
        } catch {
          /* ignore */
        }
      }

      if (payload?.error === 'rate_limited' || payload?.limited === true) {
        setRateLimited(true)
        setRemaining(0)
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id))
        return
      }

      if (payload?.error === 'usage_counter_unavailable') {
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== userMsg.id),
          {
            id: Date.now() + 1,
            role: 'assistant',
            content: tr('chat_usage_counter_unavailable', lang),
            error: true,
          },
        ])
        return
      }

      if (error) {
        console.error('[ai-coach] invoke error:', error)
        throw error
      }

      // Update remaining count
      if (typeof payload?.remaining === 'number') {
        setRemaining(payload.remaining)
      }

      const responseText: string = payload?.error
        ? `${tr('chat_error_prefix', lang)} : ${String(payload.error)}`
        : (typeof payload?.message === 'string'
          ? payload.message
          : tr('chat_no_response', lang))

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'assistant', content: responseText, error: !!payload?.error },
      ])
    } catch (err) {
      console.error('[ai-coach] threw:', err)
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'assistant', content: tr('chat_network_error', lang), error: true },
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
    <div className="min-h-screen bg-app font-sans text-fg flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.025] bg-[radial-gradient(var(--color-grid-dot)_1px,transparent_1px)] [background-size:20px_20px]" />

      <PageHeader
        title={tr('chat_page_title', lang)}
        backTo="/home"
      />

      {/* Messages area */}
      <main
        data-app-scroll-root
        className="relative flex-1 overflow-y-auto px-4 pt-5 pb-32 space-y-4 max-w-md mx-auto w-full"
      >

        {/* Welcome state */}
        {messages.length === 0 && (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-2xl bg-brand flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-on-brand" />
              </div>
              <div className="bg-layer-5 border border-border-app rounded-[1.5rem] rounded-tl-md px-4 py-3 max-w-[85%]">
                <p className="text-sm text-fg-secondary leading-relaxed">
                  {tr('chat_welcome_greeting', lang)}
                </p>
                <p className="text-sm text-fg-secondary leading-relaxed mt-1.5">
                  {tr('chat_welcome_body', lang)}
                </p>
                {premiumResolved && !hasPremiumInsights && (
                  <p className="text-xs text-fg-soft mt-2 leading-relaxed">
                    {tr('chat_free_note', lang)}
                  </p>
                )}
                {context.week && (
                  <p className="text-xs text-fg-muted mt-2">
                    {tr('chat_week_prefix', lang)} {context.week}{phaseLabel ? ` · ${tr('chat_phase_prefix', lang)} ${phaseLabel}` : ''}{context.fatigue ? ` · ${tr('chat_fatigue_prefix', lang)} : ${context.fatigue}` : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Quick prompts */}
            <div className="space-y-2 pl-11">
              <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">{tr('chat_suggestions', lang)}</p>
              <div className="flex flex-col gap-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="flex items-center gap-2.5 px-4 py-3 bg-layer-5 border border-border-app rounded-2xl text-left hover:border-brand-border-strong hover:bg-brand-soft transition-colors group rf-focus-ring"
                  >
                    <Zap className="w-3.5 h-3.5 text-brand flex-shrink-0" />
                    <span className="text-sm font-medium text-fg-emphasis group-hover:text-fg">{prompt}</span>
                  </button>
                ))}
              </div>
            </div>

            {premiumResolved && !isPremium && (
              <div className="pl-11">
                <div className="rounded-[1.5rem] border border-brand-border bg-brand-soft/80 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-2xl bg-brand-medium">
                      <Lock className="h-4 w-4 text-brand" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-fg">{tr('chat_upsell_title', lang)}</p>
                      <p className="mt-1 text-xs leading-relaxed text-fg-emphasis">
                        {tr('chat_upsell_body', lang)}
                      </p>
                      {isCheckoutSuccess && (
                        <p className="mt-2 text-[11px] leading-relaxed text-brand-tint">
                          {activationSyncing
                            ? tr('chat_payment_confirmed', lang)
                            : activationSyncTimeout
                              ? tr('chat_activation_pending', lang)
                              : tr('chat_payment_detected', lang)}
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
                        className="mt-3 inline-flex items-center justify-center rounded-2xl bg-brand px-4 py-2 text-xs font-black text-on-brand transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50 rf-focus-ring"
                      >
                        {checkoutLoading
                          ? tr('chat_loading', lang)
                          : isCheckoutSuccess
                            ? tr('chat_verify_premium', lang)
                            : tr('chat_activate_premium', lang)}
                      </button>
                      {checkoutMessage && (
                        <p className="mt-2 text-[11px] leading-relaxed text-brand-tint">
                          {checkoutMessage}
                        </p>
                      )}
                      {checkoutError && (
                        <p className="mt-2 text-[11px] leading-relaxed text-warn-body">
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
              <div className="w-7 h-7 rounded-xl bg-brand flex items-center justify-center flex-shrink-0 mb-0.5">
                <Bot className="w-3.5 h-3.5 text-on-brand" />
              </div>
            )}
            <div
               className={`max-w-[82%] px-4 py-3 rounded-[1.5rem] ${
                msg.role === 'user'
                  ? 'bg-brand text-on-brand rounded-br-md'
                  : msg.error
                    ? 'bg-warn-bg-muted border border-warn-bd text-warn-body rounded-tl-md'
                    : 'bg-layer-5 border border-border-app text-fg-secondary rounded-tl-md'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex items-end gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-xl bg-brand flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-on-brand" />
            </div>
            <div className="bg-layer-5 border border-border-app rounded-[1.5rem] rounded-tl-md px-4 py-3">
              <div className="flex gap-1.5 items-center h-4">
                <span className="w-1.5 h-1.5 rounded-full bg-fg-muted/40 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-fg-muted/40 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-fg-muted/40 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        {/* Rate limited upsell — non-dismissable */}
        {rateLimited && !isPremium && (
          <div className="pl-11">
            <PremiumUpsellCard
              title={tr('chat_rate_limit_title', lang)}
              body={tr('chat_rate_limit_body', lang)}
              ctaLabel={tr('chat_activate_premium', lang)}
              dismissable={false}
            />
          </div>
        )}

        {/* Remaining messages indicator */}
        {!isPremium && !rateLimited && remaining !== null && remaining <= 2 && remaining > 0 && (
          <div className="pl-11">
            <p className="text-[11px] text-warn bg-warn-bg-muted border border-warn-bd rounded-2xl px-4 py-2">
              {remaining === 1 ? tr('chat_last_free_message', lang) : `${remaining} ${tr('chat_remaining_suffix', lang)}`}
            </p>
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      {/* Input area — sits just above BottomNav */}
      <div className="sticky bottom-20 bg-app/95 backdrop-blur border-t border-border-app px-4 py-3">
        <div className="max-w-md mx-auto flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={tr('chat_input_placeholder', lang)}
            rows={1}
            className="flex-1 resize-none bg-layer-5 border border-border-app rounded-2xl px-4 py-2.5 text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:border-brand rf-focus-ring max-h-28 leading-relaxed"
            style={{ overflow: 'auto' }}
            disabled={loading || rateLimited}
          />
          <button
            type="button"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading || rateLimited}
            className="w-10 h-10 rounded-2xl bg-brand flex items-center justify-center flex-shrink-0 hover:bg-brand-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed rf-focus-ring"
          >
            <Send className="w-4 h-4 text-on-brand" />
          </button>
        </div>
        <p className="text-center text-[10px] text-fg-ghost mt-2">
          {tr('chat_disclaimer', lang)}
        </p>
      </div>

      <BottomNav />
    </div>
  )
}
