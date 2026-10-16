import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  isAllowedAvatarSrc,
  isAllowedCmsImageSrc,
  isAllowedHttpsUrl,
  MAX_URL_LENGTH,
  parseCanonicalUrlForSave,
  parseCmsImageUrlForSave,
  sanitizeCanonicalUrl,
  sanitizeCmsImageUrl,
  storedCmsImageUrlHiddenFromPublic,
  SOCIAL_IMAGE_URL_SAVE_ERROR,
} from '#/lib/url-security'
import { postInputSchema } from '#/lib/cms/schemas'

const SUPABASE_HTTPS = 'https://abc.supabase.co'
const MEDIA_URL = `${SUPABASE_HTTPS}/storage/v1/object/public/media/hero.png`
const AVATAR_URL = `${SUPABASE_HTTPS}/storage/v1/object/public/avatars/u1.webp`

describe('isAllowedHttpsUrl', () => {
  it('allows https URLs', () => {
    expect(isAllowedHttpsUrl('https://example.com/page')).toBe(true)
  })

  it('rejects http URLs', () => {
    expect(isAllowedHttpsUrl('http://example.com/page')).toBe(false)
  })

  it('rejects javascript URLs', () => {
    expect(isAllowedHttpsUrl('javascript:alert(1)')).toBe(false)
  })

  it('rejects URLs with embedded credentials', () => {
    expect(isAllowedHttpsUrl('https://user:pass@example.com/x')).toBe(false)
  })
})

describe('isAllowedCmsImageSrc', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('rejects all sources when VITE_SUPABASE_URL is unset', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    expect(isAllowedCmsImageSrc(MEDIA_URL)).toBe(false)
  })

  it('rejects a lookalike host', () => {
    vi.stubEnv('VITE_SUPABASE_URL', SUPABASE_HTTPS)
    expect(
      isAllowedCmsImageSrc(
        'https://evil.example/storage/v1/object/public/media/hero.png',
      ),
    ).toBe(false)
  })
})

describe('isAllowedAvatarSrc', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('rejects when env is unset', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    expect(isAllowedAvatarSrc(AVATAR_URL)).toBe(false)
  })

  it('allows https avatar URLs on the project origin', () => {
    vi.stubEnv('VITE_SUPABASE_URL', SUPABASE_HTTPS)
    expect(isAllowedAvatarSrc(AVATAR_URL)).toBe(true)
  })

  it('rejects http avatar URLs', () => {
    vi.stubEnv('VITE_SUPABASE_URL', SUPABASE_HTTPS)
    expect(
      isAllowedAvatarSrc(
        'http://abc.supabase.co/storage/v1/object/public/avatars/u1.webp',
      ),
    ).toBe(false)
  })

  it('rejects javascript URLs', () => {
    vi.stubEnv('VITE_SUPABASE_URL', SUPABASE_HTTPS)
    expect(isAllowedAvatarSrc('javascript:alert(1)')).toBe(false)
  })

  it('rejects a lookalike host', () => {
    vi.stubEnv('VITE_SUPABASE_URL', SUPABASE_HTTPS)
    expect(
      isAllowedAvatarSrc(
        'https://evil.example/storage/v1/object/public/avatars/u1.webp',
      ),
    ).toBe(false)
  })

  it('rejects media bucket paths', () => {
    vi.stubEnv('VITE_SUPABASE_URL', SUPABASE_HTTPS)
    expect(isAllowedAvatarSrc(MEDIA_URL)).toBe(false)
  })
})

describe('sanitize and parse helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('drops invalid canonical URLs on load', () => {
    expect(sanitizeCanonicalUrl('javascript:evil')).toBeNull()
    expect(sanitizeCanonicalUrl('https://ok.example/x')).toBe(
      'https://ok.example/x',
    )
  })

  it('rejects invalid canonical URLs on save', () => {
    expect(() => parseCanonicalUrlForSave('http://example.com')).toThrow(
      /https/,
    )
  })

  it('drops invalid CMS image URLs on load', () => {
    vi.stubEnv('VITE_SUPABASE_URL', SUPABASE_HTTPS)
    expect(sanitizeCmsImageUrl('https://evil.example/x.png')).toBeNull()
    expect(sanitizeCmsImageUrl(MEDIA_URL)).toBe(MEDIA_URL)
  })

  it('normalizes relative /media/ paths to absolute https href', () => {
    vi.stubEnv('VITE_SUPABASE_URL', SUPABASE_HTTPS)
    expect(sanitizeCmsImageUrl('/media/hero.png')).toBe(MEDIA_URL)
  })

  it('rejects CMS image URLs longer than 512 characters on save', () => {
    vi.stubEnv('VITE_SUPABASE_URL', SUPABASE_HTTPS)
    const long = `https://abc.supabase.co/storage/v1/object/public/media/${'a'.repeat(600)}.png`
    expect(long.length).toBeGreaterThan(MAX_URL_LENGTH)
    expect(() =>
      parseCmsImageUrlForSave(long, SOCIAL_IMAGE_URL_SAVE_ERROR),
    ).toThrow(SOCIAL_IMAGE_URL_SAVE_ERROR)
  })

  it('flags stored CMS URLs that fail the public check', () => {
    vi.stubEnv('VITE_SUPABASE_URL', SUPABASE_HTTPS)
    expect(storedCmsImageUrlHiddenFromPublic('javascript:x')).toBe(true)
    expect(storedCmsImageUrlHiddenFromPublic(MEDIA_URL)).toBe(false)
    expect(storedCmsImageUrlHiddenFromPublic('')).toBe(false)
  })

  it('rejects invalid social image URLs on save', () => {
    vi.stubEnv('VITE_SUPABASE_URL', SUPABASE_HTTPS)
    expect(() =>
      parseCmsImageUrlForSave(
        'javascript:alert(1)',
        SOCIAL_IMAGE_URL_SAVE_ERROR,
      ),
    ).toThrow(SOCIAL_IMAGE_URL_SAVE_ERROR)
  })
})

describe('postInputSchema coverImageUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('normalizes allowed cover image URLs on save', () => {
    vi.stubEnv('VITE_SUPABASE_URL', SUPABASE_HTTPS)
    const parsed = postInputSchema.parse({
      kind: 'article',
      title: 'Test',
      status: 'draft',
      coverImageUrl: '/media/hero.png',
    })
    expect(parsed.coverImageUrl).toBe(MEDIA_URL)
  })
})
