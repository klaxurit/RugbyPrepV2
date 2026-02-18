import type { AuthChangeEvent, AuthError as SupabaseAuthError, Session, Subscription, User } from '@supabase/supabase-js'
import { supabase } from '../supabase/client'
import type { AuthError, AuthUser } from '../../types/auth'
import type { Result } from '../../types/result'

interface SignUpInput {
  email: string
  displayName: string
  password: string
}

interface SignInInput {
  email: string
  password: string
}

const AVATAR_BUCKET = 'avatars'
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024

const normalizeEmail = (email: string): string => email.trim().toLowerCase()

const resolveAvatarUrl = (user: User): string | undefined => {
  const avatarPath =
    typeof user.user_metadata.avatar_path === 'string' ? user.user_metadata.avatar_path : undefined

  if (avatarPath) {
    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(avatarPath)
    return data.publicUrl
  }

  const avatarUrl =
    typeof user.user_metadata.avatar_url === 'string' ? user.user_metadata.avatar_url : undefined

  if (!avatarUrl) return undefined

  if (avatarUrl.includes('/storage/v1/object/avatars/')) {
    return avatarUrl.replace('/storage/v1/object/avatars/', '/storage/v1/object/public/avatars/')
  }

  return avatarUrl
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
  if (message.includes('email not confirmed')) return 'INVALID_CREDENTIALS'

  return 'INVALID_CREDENTIALS'
}

export const getSessionUser = async (): Promise<AuthUser | null> => {
  const { data, error } = await supabase.auth.getSession()

  if (error || !data.session?.user) return null

  return mapSupabaseUserToAuthUser(data.session.user)
}

export const onAuthStateChanged = (
  callback: (event: AuthChangeEvent, session: Session | null) => void,
): Subscription => {
  const { data } = supabase.auth.onAuthStateChange(callback)
  return data.subscription
}

export const signUp = async ({ email, displayName, password }: SignUpInput): Promise<Result<AuthUser, AuthError>> => {
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
      },
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

  return { ok: true, value: mapSupabaseUserToAuthUser(data.session.user) }
}

export const signIn = async ({ email, password }: SignInInput): Promise<Result<AuthUser, AuthError>> => {
  const normalizedEmail = normalizeEmail(email)

  if (!normalizedEmail.includes('@')) {
    return { ok: false, error: 'INVALID_EMAIL' }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
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

  return { ok: true, value: mapSupabaseUserToAuthUser(updatedUserData.user) }
}
