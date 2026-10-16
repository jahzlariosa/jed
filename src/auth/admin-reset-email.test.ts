import { describe, expect, it } from 'vitest'

import { adminPasswordResetErrorMessage } from './admin-reset-email'

describe('adminPasswordResetErrorMessage', () => {
  it('maps redirect allow list failures', () => {
    const message = adminPasswordResetErrorMessage({
      message: 'redirect_to is not allowed',
      status: 400,
    })
    expect(message).toContain('redirect allow list')
  })

  it('maps rate limits', () => {
    const message = adminPasswordResetErrorMessage({
      message: 'rate limit exceeded',
      status: 429,
    })
    expect(message).toContain('Too many reset emails')
  })
})
