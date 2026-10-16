import { describe, expect, it } from 'vitest'

import { defaultAuthNext } from './callback-search'

describe('defaultAuthNext', () => {
  it('routes recovery to reset password', () => {
    expect(defaultAuthNext({ type: 'recovery' })).toBe('/reset-password')
  })

  it('honors safe next paths', () => {
    expect(defaultAuthNext({ next: '/account' })).toBe('/account')
  })

  it('returns empty when no next is provided', () => {
    expect(defaultAuthNext({})).toBe('')
  })
})
