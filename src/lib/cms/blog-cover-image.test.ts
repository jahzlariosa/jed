import { afterEach, describe, expect, it, vi } from 'vitest'

import { sanitizeCmsImageUrl } from '#/lib/url-security'

const SUPABASE_HTTPS = 'https://abc.supabase.co'
const MEDIA_URL = `${SUPABASE_HTTPS}/storage/v1/object/public/media/cover.png`

describe('blog cover image load sanitization', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('matches blog-fns cover and og image rules', () => {
    vi.stubEnv('VITE_SUPABASE_URL', SUPABASE_HTTPS)
    expect(sanitizeCmsImageUrl('https://evil.example/cover.png')).toBeNull()
    expect(sanitizeCmsImageUrl(MEDIA_URL)).toBe(MEDIA_URL)
    expect(
      sanitizeCmsImageUrl(
        'http://abc.supabase.co/storage/v1/object/public/media/cover.png',
      ),
    ).toBeNull()
  })
})
