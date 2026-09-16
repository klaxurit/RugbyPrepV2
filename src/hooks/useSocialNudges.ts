import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../services/supabase/client'
import { useAuth } from './useAuth'
import { nudgeRowToSocialNudge } from '../services/gamification/nudgeFromRow'
import { NUDGE_RULES } from '../services/gamification/scoreConstants'
import type { Lang } from '../i18n/appLabels'
import type { SocialNudge } from '../types/gamification'

/**
 * Nudges sociaux en attente pour l'athlète courant.
 *
 * La file vit en base (`social_nudges`), écrite uniquement par le service
 * role : chaque nudge correspond à un événement réellement constaté côté
 * serveur. Le client ne peut pas en créer, et ne fait ici que lire, mettre en
 * mots et marquer comme consommé.
 *
 * Le quota d'interruption est appliqué dans `selectNudge` (une par ouverture,
 * deux par semaine) — pas ici : ce hook se contente de fournir les candidats.
 */

export interface UseSocialNudgesResult {
  candidates: SocialNudge[]
  /** Nudges déjà consommés sur la semaine glissante, pour le quota. */
  consumedThisWeek: number
  loading: boolean
  /** Marque un nudge comme vu. Irréversible : il ne réapparaîtra pas. */
  consume: (nudgeId: string) => Promise<void>
}

interface NudgeRow {
  id: string
  kind: string
  payload: Record<string, unknown> | null
  created_at: string
  consumed_at: string | null
}

export function useSocialNudges(lang: Lang): UseSocialNudgesResult {
  const { authState } = useAuth()
  const userId = authState.status === 'authenticated' ? authState.user?.id ?? null : null

  const [candidates, setCandidates] = useState<SocialNudge[]>([])
  const [consumedThisWeek, setConsumedThisWeek] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) {
      setCandidates([])
      setConsumedThisWeek(0)
      setLoading(false)
      return
    }

    const since = new Date(Date.now() - NUDGE_RULES.TTL_HOURS * 3_600_000).toISOString()

    const { data, error } = await supabase
      .from('social_nudges')
      .select('id, kind, payload, created_at, consumed_at')
      .eq('user_id', userId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('[useSocialNudges]', error.message)
      setLoading(false)
      return
    }

    const rows = (data ?? []) as NudgeRow[]

    setConsumedThisWeek(rows.filter((row) => row.consumed_at != null).length)
    setCandidates(
      rows
        .filter((row) => row.consumed_at == null)
        // Un nudge dont la mise en mots échoue (payload incomplet, coéquipier
        // redevenu privé) est écarté plutôt qu'affiché à moitié.
        .map((row) => nudgeRowToSocialNudge(row, lang))
        .filter((nudge): nudge is SocialNudge => nudge != null),
    )
    setLoading(false)
  }, [userId, lang])

  useEffect(() => {
    void load()
  }, [load])

  const consume = useCallback(
    async (nudgeId: string) => {
      setCandidates((current) => current.filter((nudge) => nudge.id !== nudgeId))
      setConsumedThisWeek((current) => current + 1)
      if (!userId) return
      const { error } = await supabase
        .from('social_nudges')
        .update({ consumed_at: new Date().toISOString() })
        .eq('id', nudgeId)
      if (error) console.warn('[useSocialNudges] consume:', error.message)
    },
    [userId],
  )

  return { candidates, consumedThisWeek, loading, consume }
}
