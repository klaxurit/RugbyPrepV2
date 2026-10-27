import { supabase } from '../supabase/client'

/**
 * Persist `onboarding_complete` on the profile row.
 * Must `await` the PostgREST builder — constructing `.upsert()` without
 * consuming the thenable never sends the request.
 */
export async function persistOnboardingComplete(userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, onboarding_complete: true }, { onConflict: 'id' })

  if (error) {
    console.warn('[profile] Failed to persist onboarding_complete:', error.message)
  }
}
