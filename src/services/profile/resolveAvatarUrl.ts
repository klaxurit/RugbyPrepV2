import { supabase } from '../supabase/client'

const AVATAR_BUCKET = 'avatars'

function normalizeStorageAvatarUrl(url: string): string {
  if (url.includes('/storage/v1/object/avatars/')) {
    return url.replace('/storage/v1/object/avatars/', '/storage/v1/object/public/avatars/')
  }
  return url
}

/**
 * URL affichable pour un profil — priorité avatar_url, sinon avatar_path (storage public).
 */
export function resolveProfileAvatarUrl(
  avatarUrl: string | null | undefined,
  avatarPath: string | null | undefined,
): string | undefined {
  const url = avatarUrl?.trim()
  if (url) return normalizeStorageAvatarUrl(url)

  const path = avatarPath?.trim()
  if (!path) return undefined

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
  return data.publicUrl || undefined
}

/** Lit avatar_url / avatar_path depuis les metadata auth (upload avatar). */
export function resolveAvatarUrlFromAuthMetadata(
  metadata: Record<string, unknown> | null | undefined,
): { avatarUrl?: string; avatarPath?: string } {
  if (!metadata) return {}
  const avatarPath =
    typeof metadata.avatar_path === 'string' ? metadata.avatar_path.trim() : undefined
  const rawUrl =
    typeof metadata.avatar_url === 'string' ? metadata.avatar_url.trim() : undefined
  const avatarUrl = rawUrl ? normalizeStorageAvatarUrl(rawUrl) : undefined
  if (avatarUrl || avatarPath) {
    return {
      avatarUrl: avatarUrl ?? resolveProfileAvatarUrl(undefined, avatarPath),
      avatarPath,
    }
  }
  return {}
}
