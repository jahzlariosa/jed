import { describe, expect, it } from 'vitest'

import {
  UUID_PATTERN,
  parseBoolean,
  parseEmail,
  parseOptionalRedirect,
  parsePassword,
  parseRoleCode,
  parseUserId,
  quotePostgrestFilterValue,
} from './validators'

describe('parseEmail', () => {
  it('trims and lowercases', () => {
    expect(parseEmail('  Jane.Doe@Example.COM ')).toBe('jane.doe@example.com')
  })

  it('accepts exactly 255 characters', () => {
    const local = 'a'.repeat(255 - '@b.co'.length)
    const email = `${local}@b.co`
    expect(email).toHaveLength(255)
    expect(parseEmail(email)).toBe(email)
  })

  it('rejects 256 characters', () => {
    const local = 'a'.repeat(256 - '@b.co'.length)
    expect(() => parseEmail(`${local}@b.co`)).toThrow('valid email')
  })

  it.each([
    '',
    ' ',
    'plain',
    'no-at.example.com',
    'a@b',
    '@example.com',
    'a@.com ',
    'a b@example.com',
    'a@exam ple.com',
    'a@@example.com',
  ])('rejects %j', (value) => {
    expect(() => parseEmail(value)).toThrow('valid email')
  })

  it.each([undefined, null, 42, {}, [], true])(
    'rejects non-string %j',
    (value) => {
      expect(() => parseEmail(value)).toThrow('valid email')
    },
  )
})

describe('parsePassword', () => {
  it('accepts the 8 and 72 character boundaries', () => {
    expect(parsePassword('a'.repeat(8))).toBe('a'.repeat(8))
    expect(parsePassword('a'.repeat(72))).toBe('a'.repeat(72))
  })

  it('rejects 7 and 73 characters', () => {
    expect(() => parsePassword('a'.repeat(7))).toThrow('8 to 72')
    expect(() => parsePassword('a'.repeat(73))).toThrow('8 to 72')
  })

  it('does not trim or alter the password', () => {
    expect(parsePassword('  spaces here  ')).toBe('  spaces here  ')
  })

  it.each([undefined, null, 12345678, {}])('rejects non-string %j', (value) => {
    expect(() => parsePassword(value)).toThrow('Enter a password')
  })
})

describe('parseUserId (UUID versions 1-8)', () => {
  const variant = '8a1b'
  const uuid = (version: string) =>
    `123e4567-e89b-${version}2d3-${variant}-426614174000`.replace(
      variant,
      'a456',
    )

  it.each(['1', '2', '3', '4', '5', '6', '7', '8'])(
    'accepts version %s',
    (version) => {
      expect(parseUserId(uuid(version))).toBe(uuid(version))
    },
  )

  it.each(['0', '9', 'a', 'f'])('rejects version %s', (version) => {
    expect(() => parseUserId(uuid(version))).toThrow('Invalid user')
  })

  it('accepts uppercase hex', () => {
    expect(parseUserId(uuid('4').toUpperCase())).toBe(uuid('4').toUpperCase())
  })

  it.each(['8', '9', 'a', 'b'])('accepts RFC variant nibble %s', (nibble) => {
    expect(
      parseUserId(`123e4567-e89b-42d3-${nibble}456-426614174000`),
    ).toBeTruthy()
  })

  it.each(['0', '7', 'c', 'f'])('rejects variant nibble %s', (nibble) => {
    expect(() =>
      parseUserId(`123e4567-e89b-42d3-${nibble}456-426614174000`),
    ).toThrow('Invalid user')
  })

  it.each([
    '',
    'not-a-uuid',
    '123e4567e89b42d3a456426614174000',
    '123e4567-e89b-42d3-a456-42661417400',
    '123e4567-e89b-42d3-a456-4266141740000',
    ' 123e4567-e89b-42d3-a456-426614174000',
    '123e4567-e89b-42d3-a456-426614174000 ',
    '123e4567-e89b-42d3-a456-42661417400g',
    "123e4567-e89b-42d3-a456-426614174000'; drop table profiles;--",
  ])('rejects %j', (value) => {
    expect(() => parseUserId(value)).toThrow('Invalid user')
  })

  it.each([undefined, null, 1, {}])('rejects non-string %j', (value) => {
    expect(() => parseUserId(value)).toThrow('Invalid user')
  })

  it('exports the same pattern it enforces', () => {
    expect(UUID_PATTERN.test('123e4567-e89b-42d3-a456-426614174000')).toBe(true)
  })
})

describe('parseRoleCode', () => {
  it('accepts lowercase snake case starting with a letter', () => {
    expect(parseRoleCode('admin')).toBe('admin')
    expect(parseRoleCode('content_editor_2')).toBe('content_editor_2')
  })

  it('accepts exactly 64 characters and rejects 65', () => {
    expect(parseRoleCode('a'.repeat(64))).toBe('a'.repeat(64))
    expect(() => parseRoleCode('a'.repeat(65))).toThrow('Invalid role')
  })

  it.each([
    '',
    '1admin',
    '_admin',
    'Admin',
    'ADMIN',
    'content-editor',
    'content editor',
    'admin.access',
    'admin\n',
    "admin'; --",
    'ädmin',
  ])('rejects %j', (value) => {
    expect(() => parseRoleCode(value)).toThrow('Invalid role')
  })

  it.each([undefined, null, 1, []])('rejects non-string %j', (value) => {
    expect(() => parseRoleCode(value)).toThrow('Invalid role')
  })
})

describe('parseBoolean', () => {
  it('accepts only real booleans', () => {
    expect(parseBoolean(true)).toBe(true)
    expect(parseBoolean(false)).toBe(false)
    for (const value of ['true', 1, 0, null, undefined, 'false']) {
      expect(() => parseBoolean(value)).toThrow('Invalid value')
    }
  })
})

describe('parseOptionalRedirect', () => {
  it('returns undefined for absent values', () => {
    expect(parseOptionalRedirect(undefined)).toBeUndefined()
    expect(parseOptionalRedirect(null)).toBeUndefined()
    expect(parseOptionalRedirect('')).toBeUndefined()
  })

  it('keeps safe internal paths', () => {
    expect(parseOptionalRedirect('/admin-panel')).toBe('/admin-panel')
  })

  it('drops unsafe paths instead of falling back to /account', () => {
    expect(parseOptionalRedirect('//evil.com')).toBeUndefined()
    expect(parseOptionalRedirect('https://evil.com')).toBeUndefined()
    expect(parseOptionalRedirect('%2F%2Fevil')).toBeUndefined()
    expect(parseOptionalRedirect(`/${'a'.repeat(600)}`)).toBeUndefined()
  })

  it('rejects non-string values', () => {
    for (const value of [1, true, {}, []]) {
      expect(() => parseOptionalRedirect(value)).toThrow('Invalid redirect')
    }
  })
})

describe('quotePostgrestFilterValue', () => {
  it('wraps values so commas cannot inject extra or filters', () => {
    const pattern = quotePostgrestFilterValue('%injected,actor_id.eq.x%')
    const orFilter = `action.ilike.${pattern},target_type.ilike.${pattern}`
    expect(pattern.startsWith('"')).toBe(true)
    expect(pattern.endsWith('"')).toBe(true)
    expect(orFilter).toContain('injected,actor_id.eq.x')
    expect(orFilter).not.toMatch(/ilike\.%[^"]*,/)
  })
})
