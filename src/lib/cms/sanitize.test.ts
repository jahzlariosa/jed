import { afterEach, describe, expect, it, vi } from 'vitest'

import { isAllowedCmsImageSrc, sanitizeRichHtml } from '#/lib/cms/sanitize'

const SUPABASE_HTTPS = 'https://abc.supabase.co'

describe('isAllowedCmsImageSrc', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('rejects all sources when VITE_SUPABASE_URL is unset', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    expect(isAllowedCmsImageSrc('/media/hero.png')).toBe(false)
    expect(
      isAllowedCmsImageSrc(
        'https://abc.supabase.co/storage/v1/object/public/media/hero.png',
      ),
    ).toBe(false)
  })

  it('allows https URLs on the configured Supabase origin', () => {
    vi.stubEnv('VITE_SUPABASE_URL', SUPABASE_HTTPS)
    expect(
      isAllowedCmsImageSrc(
        'https://abc.supabase.co/storage/v1/object/public/media/hero.png',
      ),
    ).toBe(true)
  })

  it('allows relative /media/ paths resolved to the public bucket', () => {
    vi.stubEnv('VITE_SUPABASE_URL', SUPABASE_HTTPS)
    expect(isAllowedCmsImageSrc('/media/hero.png')).toBe(true)
  })

  it('rejects a lookalike path on another host', () => {
    vi.stubEnv('VITE_SUPABASE_URL', SUPABASE_HTTPS)
    expect(
      isAllowedCmsImageSrc(
        'https://evil.example/storage/v1/object/public/media/hero.png',
      ),
    ).toBe(false)
  })

  it('rejects http image URLs', () => {
    vi.stubEnv('VITE_SUPABASE_URL', SUPABASE_HTTPS)
    expect(
      isAllowedCmsImageSrc(
        'http://abc.supabase.co/storage/v1/object/public/media/hero.png',
      ),
    ).toBe(false)
  })
})

describe('sanitizeRichHtml', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('keeps BlockNote public HTML wrappers and paragraph text', () => {
    const html =
      '<div class="bn-block-group" data-node-type="blockGroup"><div class="bn-block-outer" data-node-type="blockOuter"><div class="bn-block-content" data-content-type="paragraph"><p class="bn-inline-content">Hello</p></div></div></div>'
    const safe = sanitizeRichHtml(html)
    expect(safe).toContain('Hello')
    expect(safe).toContain('bn-block-group')
  })

  it('strips img tags with disallowed src on save and render paths', () => {
    vi.stubEnv('VITE_SUPABASE_URL', SUPABASE_HTTPS)
    const html =
      '<p>Hi</p><img src="https://evil.example/x.png" alt="x" /><img src="/media/safe.png" alt="ok" />'
    const safe = sanitizeRichHtml(html)
    expect(safe).not.toContain('evil.example')
    expect(safe).toContain('/media/safe.png')
  })
})
