/**
 * useAICoach — appelle la Supabase Edge Function ai-coach
 *
 * Cas d'usage supportés :
 *   deload_explain : pourquoi décharger + conseils pratiques
 *   session_advice : conseil pré-séance selon fatigue / ACWR
 *   free_chat      : chat libre avec le coach
 */
import { useState, useCallback } from 'react'
import { supabase } from '../services/supabase/client'

// ─── Types ───────────────────────────────────────────────────

export type AIUseCase = 'deload_explain' | 'session_advice' | 'free_chat'

export interface AICoachContext {
  week?: string
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

interface AICoachState {
  message: string | null
  loading: boolean
  error: string | null
}

// ─── Hook ────────────────────────────────────────────────────

export function useAICoach() {
  const [state, setState] = useState<AICoachState>({
    message: null,
    loading: false,
    error: null,
  })

  const ask = useCallback(async (
    useCase: AIUseCase,
    context: AICoachContext,
    userMessage?: string
  ) => {
    setState({ message: null, loading: true, error: null })

    try {
      const { data, error } = await supabase.functions.invoke('ai-coach', {
        body: { useCase, context, userMessage },
      })

      if (error) throw error

      // La fonction peut retourner { error: "..." } avec status 200 (erreur Anthropic wrappée)
      if (data?.error) {
        setState({ message: null, loading: false, error: data.error })
        return null
      }

      setState({
        message: data?.message ?? null,
        loading: false,
        error: null,
      })

      return data?.message as string | null
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setState({ message: null, loading: false, error: msg })
      return null
    }
  }, [])

  const reset = useCallback(() => {
    setState({ message: null, loading: false, error: null })
  }, [])

  return {
    ...state,
    ask,
    reset,
  }
}
