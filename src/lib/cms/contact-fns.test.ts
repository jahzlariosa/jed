import { describe, expect, it, vi } from 'vitest'

vi.mock('#/auth/session.server', () => ({ markPrivateNoStore: vi.fn() }))
vi.mock('#/lib/cms/public-marketing.server', () => ({
  loadPublicMarketing: vi.fn(),
}))
vi.mock('#/lib/rate-limit.server', () => ({ assertRateLimit: vi.fn() }))
vi.mock('#/lib/supabase/service-role.server', () => ({
  createServiceRoleClient: vi.fn(),
}))

import { parseContactInput } from '#/lib/cms/contact-input'

const BASE = { name: 'Ana', message: 'Hi', company: '' }

describe('parseContactInput', () => {
  it('keeps a normal email', () => {
    expect(parseContactInput({ ...BASE, email: 'Ana@Example.com' }).email).toBe(
      'ana@example.com',
    )
  })

  it('rejects emails with mailto query parameters', () => {
    expect(
      parseContactInput({ ...BASE, email: 'a@b.co?bcc=evil%40x.com' }).email,
    ).toBe('')
    expect(
      parseContactInput({ ...BASE, email: 'a@b.co&cc=evil@x.com' }).email,
    ).toBe('')
  })

  it('strips line breaks and control characters from the name', () => {
    expect(
      parseContactInput({ ...BASE, name: 'Ana\r\nBcc: x', email: 'a@b.co' })
        .name,
    ).toBe('Ana Bcc: x')
  })
})
