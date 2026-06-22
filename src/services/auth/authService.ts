import { supabase } from '../supabase/client'
import type { AuthChangeEvent, AuthError as SupabaseAuthError, Session, Subscription, User } from '@supabase/supabase-js'
import {
  resolveAvatarUrlFromAuthMetadata,
} from '../profile/resolveAvatarUrl'
import type { AuthError, AuthUser } from '../../types/auth'
import type { Result } from '../../types/result'

interface SignUpInput {
  email: string
  displayName: string
  password: string
  /** ISO timestamp captured when the user ticked the medical disclaimer checkbox at signup. */
  medicalConsentAcceptedAt: string
  /** WS2 — hCaptcha token; required when the dashboard captcha gate is active. */
  captchaToken?: string
}

interface SignInInput {
  email: string
  password: string
  /** WS2 — hCaptcha token; required when the dashboard captcha gate is active. */
  captchaToken?: string
}

const AVATAR_BUCKET = 'avatars'
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024

const normalizeEmail = (email: string): string => email.trim().toLowerCase()

const resolveAvatarUrl = (user: User): string | undefined => {
  const fromMeta = resolveAvatarUrlFromAuthMetadata(user.user_metadata)
  return fromMeta.avatarUrl
}

export const mapSupabaseUserToAuthUser = (user: User): AuthUser => ({
  id: user.id,
  email: user.email ?? '',
  displayName:
    (typeof user.user_metadata.display_name === 'string' && user.user_metadata.display_name.trim()) ||
    (user.email ? user.email.split('@')[0] : 'Joueur'),
  createdAt: new Date(user.created_at).getTime(),
  avatarUrl: resolveAvatarUrl(user),
})

const isEmailExistsError = (error: SupabaseAuthError | null, user: User | null): boolean => {
  if (error) {
    const message = error.message.toLowerCase()
    return message.includes('already registered') || message.includes('already been registered') || message.includes('user already exists')
  }

  if (user && Array.isArray(user.identities) && user.identities.length === 0) {
    return true
  }

  return false
}

const mapSignInError = (error: SupabaseAuthError | null): AuthError => {
  if (!error) return 'INVALID_CREDENTIALS'

  if (error.status === 429) return 'RATE_LIMIT'

  const message = error.message.toLowerCase()

  if (message.includes('invalid login credentials')) return 'INVALID_CREDENTIALS'
  if (message.includes('email not confirmed')) return 'EMAIL_CONFIRMATION_REQUIRED'

  return 'INVALID_CREDENTIALS'
}

export const getSessionUser = async (): Promise<AuthUser | null> => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null

  return mapSupabaseUserToAuthUser(user)
}

export const onAuthStateChanged = (
  callback: (event: AuthChangeEvent, session: Session | null) => void,
): Subscription => {
  const { data } = supabase.auth.onAuthStateChange(callback)
  return data.subscription
}

export const signUp = async ({ email, displayName, password, medicalConsentAcceptedAt, captchaToken }: SignUpInput): Promise<Result<AuthUser, AuthError>> => {
  const normalizedEmail = normalizeEmail(email)
  const cleanDisplayName = displayName.trim()

  if (!normalizedEmail.includes('@')) {
    return { ok: false, error: 'INVALID_EMAIL' }
  }

  if (password.length < 6) {
    return { ok: false, error: 'WEAK_PASSWORD' }
  }

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        display_name: cleanDisplayName || normalizedEmail.split('@')[0] || 'Joueur',
        // WS9 — mirrors into raw_user_meta_data so the timestamp survives the
        // email-confirmation roundtrip even when no session is available yet.
        medical_consent_accepted_at: medicalConsentAcceptedAt,
      },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      captchaToken,
    },
  })

  if (isEmailExistsError(error, data.user)) {
    return { ok: false, error: 'EMAIL_EXISTS' }
  }

  if (error?.status === 429) {
    return { ok: false, error: 'RATE_LIMIT' }
  }

  if (error || !data.user) {
    return { ok: false, error: 'INVALID_CREDENTIALS' }
  }

  if (!data.session?.user) {
    return { ok: false, error: 'EMAIL_CONFIRMATION_REQUIRED' }
  }

  // WS9 — persist consent timestamp into profiles when we have an immediate
  // session (auto-confirm). For email-confirmation flow, the timestamp lives
  // in raw_user_meta_data and is mirrored on first authenticated session.
  void supabase
    .from('profiles')
    .upsert(
      { id: data.session.user.id, medical_consent_accepted_at: medicalConsentAcceptedAt },
      { onConflict: 'id' },
    )

  return { ok: true, value: mapSupabaseUserToAuthUser(data.session.user) }
}

export const signIn = async ({ email, password, captchaToken }: SignInInput): Promise<Result<AuthUser, AuthError>> => {
  const normalizedEmail = normalizeEmail(email)

  if (!normalizedEmail.includes('@')) {
    return { ok: false, error: 'INVALID_EMAIL' }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
    options: { captchaToken },
  })

  if (error || !data.user) {
    return { ok: false, error: mapSignInError(error) }
  }

  return { ok: true, value: mapSupabaseUserToAuthUser(data.user) }
}

export const signOut = async (): Promise<void> => {
  await supabase.auth.signOut()
}

export const updateAvatar = async (file: File): Promise<Result<AuthUser, AuthError>> => {
  if (!file.type.startsWith('image/')) {
    return { ok: false, error: 'INVALID_FILE_TYPE' }
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    return { ok: false, error: 'FILE_TOO_LARGE' }
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { ok: false, error: 'INVALID_CREDENTIALS' }
  }

  const extension = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() : 'jpg'
  const safeExtension = extension && extension.length < 8 ? extension : 'jpg'
  const filePath = `${user.id}/${Date.now()}.${safeExtension}`

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(filePath, file, { upsert: true, contentType: file.type })

  if (uploadError) {
    return { ok: false, error: 'UPLOAD_FAILED' }
  }

  const { data: publicData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath)
  const avatarUrl = publicData.publicUrl

  const { data: updatedUserData, error: updateError } = await supabase.auth.updateUser({
    data: { avatar_path: filePath, avatar_url: avatarUrl },
  })

  if (updateError || !updatedUserData.user) {
    return { ok: false, error: 'UPLOAD_FAILED' }
  }

  const { error: profileMirrorError } = await supabase
    .from('profiles')
    .update({
      avatar_path: filePath,
      avatar_url: avatarUrl,
    })
    .eq('id', user.id)

  if (profileMirrorError) {
    console.warn('[authService] Failed to mirror avatar into profiles:', profileMirrorError.message)
  }

  return { ok: true, value: mapSupabaseUserToAuthUser(updatedUserData.user) }
}
