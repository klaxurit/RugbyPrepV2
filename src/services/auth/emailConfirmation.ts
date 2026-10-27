import { supabase } from '../supabase/client'

export function shouldPromptEmailConfirmation(input: {
  emailConfirmed: boolean | undefined
  email: string | undefined
}): boolean {
  if (input.emailConfirmed !== false) return false
  const email = input.email?.trim() ?? ''
  return email.includes('@')
}

export async function resendSignupConfirmation(email: string): Promise<{
  ok: true
} | {
  ok: false
  error: 'rate_limit' | 'failed'
}> {
  const { error } = await supabase.auth.resend({ type: 'signup', email })
  if (!error) return { ok: true }
  if (error.status === 429) return { ok: false, error: 'rate_limit' }
  return { ok: false, error: 'failed' }
}
