import { describe, expect, it } from 'vitest'

import {
  API_TOKEN_PREFIX,
  generateApiTokenSecret,
  hashApiToken,
  isApiTokenFormat,
} from './token-hash'

describe('token-hash', () => {
  it('generates prefixed secrets', () => {
    const { token, prefix } = generateApiTokenSecret()
    expect(token.startsWith(API_TOKEN_PREFIX)).toBe(true)
    expect(prefix.startsWith(API_TOKEN_PREFIX)).toBe(true)
    expect(hashApiToken(token)).toHaveLength(64)
  })

  it('validates token format', () => {
    expect(isApiTokenFormat('amn_live_abc123xyz0123456789')).toBe(true)
    expect(isApiTokenFormat('bad')).toBe(false)
  })
})
