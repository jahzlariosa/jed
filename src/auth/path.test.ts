import { describe, expect, it } from 'vitest'

import { safeInternalPath } from './path'

const FALLBACK = '/account'

describe('safeInternalPath', () => {
  it('keeps plain same-origin paths, queries and hashes', () => {
    expect(safeInternalPath('/account')).toBe('/account')
    expect(safeInternalPath('/admin-panel/roles?tab=1#top')).toBe(
      '/admin-panel/roles?tab=1#top',
    )
    expect(safeInternalPath('/')).toBe('/')
  })

  it('trims surrounding whitespace', () => {
    expect(safeInternalPath('  /account  ')).toBe('/account')
  })

  it('falls back for empty or missing input', () => {
    expect(safeInternalPath(undefined)).toBe(FALLBACK)
    expect(safeInternalPath('')).toBe(FALLBACK)
    expect(safeInternalPath('   ')).toBe(FALLBACK)
  })

  it('uses a custom fallback when given', () => {
    expect(safeInternalPath('//evil.com', null)).toBe(null)
    expect(safeInternalPath('//evil.com', '/home')).toBe('/home')
  })

  it('rejects path traversal segments', () => {
    expect(safeInternalPath('/account/../admin', null)).toBe(null)
    expect(safeInternalPath('/%2e%2e/admin', null)).toBe(null)
  })

  describe('open-redirect cases', () => {
    const cases: Array<[string, string]> = [
      ['protocol-relative //evil.com', '//evil.com'],
      ['slash-backslash /\\evil', '/\\evil'],
      ['backslash-only \\evil', '\\evil'],
      ['absolute https://x', 'https://x'],
      ['absolute http://evil.com/a', 'http://evil.com/a'],
      ['scheme-relative path with ://', '/redirect?to=https://evil.com'],
      ['encoded %2F%2Fevil', '%2F%2Fevil'],
      ['leading slash + encoded //', '/%2F%2Fevil'],
      ['encoded %2f%2fevil (lowercase)', '%2f%2fevil'],
      ['double-encoded %252F%252Fevil', '%252F%252Fevil'],
      ['double-encoded with leading slash', '/%252F%252Fevil'],
      ['triple-encoded', '%25252F%25252Fevil'],
      ['encoded backslash /%5Cevil', '/%5Cevil'],
      ['double-encoded backslash /%255Cevil', '/%255Cevil'],
      ['encoded scheme https%3A%2F%2Fevil.com', 'https%3A%2F%2Fevil.com'],
      ['javascript: scheme', 'javascript:alert(1)'],
      ['JAVASCRIPT: scheme (case)', 'JAVASCRIPT:alert(1)'],
      ['encoded javascript:', 'javascript%3Aalert(1)'],
      ['data: scheme', 'data:text/html,<script>alert(1)</script>'],
      ['relative path without slash', 'account'],
      ['dot path', './account'],
    ]

    it.each(cases)('%s', (_label, input) => {
      expect(safeInternalPath(input)).toBe(FALLBACK)
    })
  })

  describe('control characters', () => {
    it.each([
      ['NUL', '/a\u0000b'],
      ['tab', '/a\tb'],
      ['newline (header injection)', '/a\nLocation: https://evil.com'],
      ['carriage return', '/a\rb'],
      ['DEL', '/a\u007Fb'],
      ['encoded newline %0A', '/a%0Ab'],
      ['encoded CR %0D%0A', '/a%0D%0Ab'],
      ['double-encoded newline', '/a%250Ab'],
      ['leading tab then //', '\t//evil.com'],
      ['leading newline then //', '\n//evil.com'],
    ])('%s', (_label, input) => {
      expect(safeInternalPath(input)).toBe(FALLBACK)
    })
  })

  describe('length limit (512)', () => {
    it('accepts exactly 512 characters', () => {
      const path = `/${'a'.repeat(511)}`
      expect(path).toHaveLength(512)
      expect(safeInternalPath(path)).toBe(path)
    })

    it('rejects 513 characters', () => {
      const path = `/${'a'.repeat(512)}`
      expect(path).toHaveLength(513)
      expect(safeInternalPath(path)).toBe(FALLBACK)
    })

    it('rejects very long input', () => {
      expect(safeInternalPath(`/${'a'.repeat(5000)}`)).toBe(FALLBACK)
    })
  })

  describe('malformed encoding', () => {
    it('falls back on a bad percent escape', () => {
      expect(safeInternalPath('/%E0%A4%A')).toBe(FALLBACK)
      expect(safeInternalPath('/%')).toBe(FALLBACK)
    })
  })

  it('never returns a path that browsers could treat as another origin', () => {
    const hostile = [
      '//evil.com',
      '///evil.com',
      '/\\evil.com',
      '/%2F/evil.com',
      '/%5C/evil.com',
      '%2F%2Fevil.com',
      '/.%2F/evil.com',
      'https://evil.com',
      '/ok\\@evil.com',
    ]
    for (const input of hostile) {
      const result = safeInternalPath(input)
      expect(result).not.toBeNull()
      if (!result) {
        continue
      }
      expect(result.startsWith('//')).toBe(false)
      expect(result.includes('\\')).toBe(false)
      expect(result.includes('://')).toBe(false)
      expect(result.startsWith('/')).toBe(true)
    }
  })
})
