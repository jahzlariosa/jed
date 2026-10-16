import { afterEach, describe, expect, it, vi } from 'vitest'

import { blocksToHtmlServer } from '#/lib/cms/blocks-to-html.server'

const SUPABASE_HTTPS = 'https://abc.supabase.co'
const MEDIA_URL = `${SUPABASE_HTTPS}/storage/v1/object/public/media/hero.png`

describe('blocksToHtmlServer image blocks', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('round-trips an editor image block into stored HTML', () => {
    vi.stubEnv('VITE_SUPABASE_URL', SUPABASE_HTTPS)
    const html = blocksToHtmlServer([
      {
        type: 'image',
        props: {
          url: MEDIA_URL,
          name: 'Hero photo',
          caption: 'On the homepage',
        },
      },
    ])
    expect(html).toContain(`src="${MEDIA_URL}"`)
    expect(html).toContain('alt="Hero photo"')
    expect(html).toContain('<img ')
    expect(html).toContain('<figcaption>On the homepage</figcaption>')
    expect(html).toContain('<figure>')
  })

  it('drops image blocks with disallowed src before sanitize', () => {
    vi.stubEnv('VITE_SUPABASE_URL', SUPABASE_HTTPS)
    const html = blocksToHtmlServer([
      {
        type: 'image',
        props: {
          url: 'https://evil.example/steal.png',
          name: 'Bad',
          caption: 'Nope',
        },
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Still here' }],
      },
    ])
    expect(html).not.toContain('evil.example')
    expect(html).toContain('Still here')
  })
})
