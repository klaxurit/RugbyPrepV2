import { useState, useRef, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Send, Bot, Zap } from 'lucide-react'
import { useProfile } from '../hooks/useProfile'
import { useWeek } from '../hooks/useWeek'
import { useFatigue } from '../hooks/useFatigue'
import { useHistory } from '../hooks/useHistory'
import { useACWR } from '../hooks/useACWR'
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

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const phase = getPhaseForWeek(week === 'DELOAD' ? week : week)
  const phaseLabel = phase ? PHASE_LABELS[phase] : null
  const isDeload = week === 'DELOAD'

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
    if (isDeload) prompts.unshift(QUICK_PROMPT_DELOAD)
    else if (phase && QUICK_PROMPTS_BY_PHASE[phase]) prompts.unshift(QUICK_PROMPTS_BY_PHASE[phase])
    return prompts.slice(0, 5)
  }, [phase, isDeload])

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

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
    } catch (err) {
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
    <div className="min-h-screen bg-gray-50 font-sans text-slate-900 flex flex-col">

      {/* Header */}
      <header className="px-6 py-4 bg-white border-b border-gray-100 flex items-center gap-3 sticky top-0 z-50">
        <Link to="/" className="p-2 -ml-2 rounded-xl hover:bg-gray-50 transition-colors">
          <ChevronLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-9 h-9 rounded-2xl bg-rose-600 flex items-center justify-center flex-shrink-0">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest text-rose-600 uppercase italic">RugbyPrep</p>
            <h1 className="text-base font-extrabold tracking-tight text-slate-900 leading-tight">Coach IA</h1>
          </div>
        </div>
        {/* Context badge */}
        {(phaseLabel || isDeload) && (
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-[10px] font-black text-slate-500 tracking-wide">
            {isDeload ? 'DÉCHARGE' : phaseLabel?.toUpperCase()}
          </span>
        )}
      </header>

      {/* Messages area */}
      <main className="flex-1 overflow-y-auto px-4 pt-5 pb-32 space-y-4 max-w-md mx-auto w-full">

        {/* Welcome state */}
        {messages.length === 0 && (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-2xl bg-rose-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-gray-100 rounded-[1.5rem] rounded-tl-md px-4 py-3 shadow-sm max-w-[85%]">
                <p className="text-sm text-slate-700 leading-relaxed">
                  Salut ! Je suis ton coach IA RugbyPrep 🏉
                </p>
                <p className="text-sm text-slate-700 leading-relaxed mt-1.5">
                  Pose-moi n'importe quelle question sur l'entraînement, la nutrition, la récupération ou le sommeil. Je connais ton profil et ta semaine en cours.
                </p>
                {context.week && (
                  <p className="text-xs text-slate-400 mt-2">
                    Semaine {context.week}{phaseLabel ? ` · Phase ${phaseLabel}` : ''}{context.fatigue ? ` · Fatigue : ${context.fatigue}` : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Quick prompts */}
            <div className="space-y-2 pl-11">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Suggestions</p>
              <div className="flex flex-col gap-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="flex items-center gap-2.5 px-4 py-3 bg-white border border-gray-100 rounded-2xl text-left hover:border-rose-200 hover:bg-rose-50 transition-colors group shadow-sm"
                  >
                    <Zap className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 group-hover:text-rose-600" />
                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800">{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-xl bg-rose-600 flex items-center justify-center flex-shrink-0 mb-0.5">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div
              className={`max-w-[82%] px-4 py-3 rounded-[1.5rem] shadow-sm ${
                msg.role === 'user'
                  ? 'bg-rose-600 text-white rounded-br-md'
                  : msg.error
                    ? 'bg-amber-50 border border-amber-100 text-amber-700 rounded-tl-md'
                    : 'bg-white border border-gray-100 text-slate-700 rounded-tl-md'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex items-end gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-xl bg-rose-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-white border border-gray-100 rounded-[1.5rem] rounded-tl-md px-4 py-3 shadow-sm">
              <div className="flex gap-1.5 items-center h-4">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      {/* Input area — sits just above BottomNav */}
      <div className="sticky bottom-20 bg-white border-t border-gray-100 px-4 py-3">
        <div className="max-w-md mx-auto flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pose ta question..."
            rows={1}
            className="flex-1 resize-none bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-200 max-h-28 leading-relaxed"
            style={{ overflow: 'auto' }}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center flex-shrink-0 hover:bg-rose-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-300 mt-2">
          Conseils sportifs uniquement — pas un avis médical
        </p>
      </div>

      <BottomNav />
    </div>
  )
}
