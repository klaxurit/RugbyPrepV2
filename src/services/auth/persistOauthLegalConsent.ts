import { supabase } from '../supabase/client'

export async function fetchMedicalConsentAcceptedAt(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('medical_consent_accepted_at')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) return null
  return typeof data.medical_consent_accepted_at === 'string' && data.medical_consent_accepted_at
    ? data.medical_consent_accepted_at
    : null
}

/**
 * Persist 18+ / medical consent after Google OAuth.
 * Must `await` the PostgREST builder — constructing `.upsert()` without
 * consuming the thenable never sends the request.
 */
export async function persistOauthLegalConsent(input: {
  userId: string
  medicalConsentAcceptedAt: string
  newsletterOptIn?: boolean
}): Promise<void> {
  const newsletterOptedAt = new Date().toISOString()
  const { error } = await supabase.from('profiles').upsert(
    {
      id: input.userId,
      medical_consent_accepted_at: input.medicalConsentAcceptedAt,
      adult_play_eligibility_approved: true,
      password_needs_upgrade: false,
      ...(typeof input.newsletterOptIn === 'boolean'
        ? {
            newsletter_opt_in: input.newsletterOptIn,
            newsletter_opted_at: newsletterOptedAt,
            newsletter_opt_in_source: 'signup',
          }
        : {}),
    },
    { onConflict: 'id' },
  )

  if (error) {
    console.warn('[auth] Failed to persist OAuth legal consent:', error.message)
  }

  const { error: metaError } = await supabase.auth.updateUser({
    data: {
      medical_consent_accepted_at: input.medicalConsentAcceptedAt,
      ...(typeof input.newsletterOptIn === 'boolean'
        ? {
            newsletter_opt_in: input.newsletterOptIn,
            newsletter_opted_at: newsletterOptedAt,
          }
        : {}),
    },
  })

  if (metaError) {
    console.warn('[auth] Failed to mirror OAuth legal consent in user metadata:', metaError.message)
  }
}
