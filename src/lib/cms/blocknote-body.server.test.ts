import { afterEach, describe, expect, it, vi } from 'vitest'

import { emptyBlockDocument } from '#/lib/cms/blocknote-types'
import { persistBodyFromClient } from '#/lib/cms/blocknote-body.server'

describe('persistBodyFromClient', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('sanitizes HTML before save', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://abc.supabase.co')
    const { body_html } = persistBodyFromClient(
      emptyBlockDocument(),
      '<p>Hi</p><img src="https://evil.example/x.png" alt="x" /><img src="/media/safe.png" alt="ok" />',
    )
    expect(body_html).not.toContain('evil.example')
    expect(body_html).toContain('/media/safe.png')
  })
})
