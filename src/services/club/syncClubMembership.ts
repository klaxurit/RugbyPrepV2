import { supabase } from '../supabase/client'

/**
 * Synchronise club_athlete_memberships pour le compte connecté.
 * Appelé quand l'utilisateur rejoint ou quitte un club dans son profil.
 */
export async function syncMyClubMembership(clubCode: string | null | undefined): Promise<void> {
  const code = clubCode?.trim() ?? ''
  const { error } = await supabase.functions.invoke('sync-club-membership', {
    body: { clubCode: code || null },
  })
  if (error) {
    console.warn('[syncMyClubMembership]', error.message)
  }
}
