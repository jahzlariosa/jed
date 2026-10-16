import { describe, expect, it } from 'vitest'

import { PERMISSIONS, isPermission } from './permissions'

describe('isPermission', () => {
  it('accepts every known permission code', () => {
    for (const code of Object.values(PERMISSIONS)) {
      expect(isPermission(code)).toBe(true)
    }
  })

  it('drops unknown, malformed and look-alike codes (fail closed)', () => {
    for (const code of [
      '',
      'admin',
      'admin.*',
      '*',
      'admin.access ',
      ' admin.access',
      'ADMIN.ACCESS',
      'admin.access\n',
      'roles.delete_everything',
      'profiles.write_all',
      '__proto__',
      'constructor',
      'toString',
    ]) {
      expect(isPermission(code)).toBe(false)
    }
  })

  it('filters a mixed list from the database down to known codes only', () => {
    const fromDb = [
      'admin.access',
      'made.up',
      'roles.manage',
      'profiles.read_all',
      'x',
    ]
    expect(fromDb.filter(isPermission)).toEqual([
      'admin.access',
      'roles.manage',
      'profiles.read_all',
    ])
  })
})
