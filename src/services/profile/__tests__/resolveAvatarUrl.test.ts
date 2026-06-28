import { describe, expect, it, vi } from 'vitest'

vi.mock('../../supabase/client', () => ({
  supabase: {
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `https://example.supabase.co/storage/v1/object/public/avatars/${path}` },
        }),
      }),
    },
  },
}))

import {
  resolveAvatarUrlFromAuthMetadata,
  resolveProfileAvatarUrl,
} from '../resolveAvatarUrl'

describe('resolveProfileAvatarUrl', () => {
  it('retourne avatar_url normalisé', () => {
    expect(
      resolveProfileAvatarUrl(
        'https://x.supabase.co/storage/v1/object/avatars/u1/a.png',
        null,
      ),
    ).toBe('https://x.supabase.co/storage/v1/object/public/avatars/u1/a.png')
  })

  it('construit l’URL depuis avatar_path si avatar_url absent', () => {
    expect(resolveProfileAvatarUrl(null, 'u1/photo.png')).toBe(
      'https://example.supabase.co/storage/v1/object/public/avatars/u1/photo.png',
    )
  })
})

describe('resolveAvatarUrlFromAuthMetadata', () => {
  it('lit avatar_path et avatar_url depuis auth metadata', () => {
    const r = resolveAvatarUrlFromAuthMetadata({
      avatar_path: 'u1/p.png',
      avatar_url: 'https://x.supabase.co/storage/v1/object/public/avatars/u1/p.png',
    })
    expect(r.avatarPath).toBe('u1/p.png')
    expect(r.avatarUrl).toContain('u1/p.png')
  })
})
