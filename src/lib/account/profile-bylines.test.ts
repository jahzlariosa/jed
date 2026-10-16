import { afterEach, describe, expect, it, vi } from 'vitest'

import { mapProfileByline } from '#/lib/account/profile-bylines'

const SUPABASE_HTTPS = 'https://abc.supabase.co'
const AVATAR_URL = `${SUPABASE_HTTPS}/storage/v1/object/public/avatars/u1.webp`

describe('mapProfileByline', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('sanitizes avatar_url for byline consumers', () => {
    vi.stubEnv('VITE_SUPABASE_URL', SUPABASE_HTTPS)
    const byline = mapProfileByline({
      user_id: 'u1',
      display_name: 'Ada',
      avatar_url: AVATAR_URL,
    })
    expect(byline.avatarUrl).toBe(AVATAR_URL)
  })

  it('drops unsafe avatar_url values', () => {
    vi.stubEnv('VITE_SUPABASE_URL', SUPABASE_HTTPS)
    const byline = mapProfileByline({
      user_id: 'u1',
      display_name: 'Ada',
      avatar_url: 'javascript:alert(1)',
    })
    expect(byline.avatarUrl).toBeNull()
  })
})
