import { describe, expect, it } from 'vitest'

import {
  isAdminThemePreference,
  resolveAdminTheme,
} from '#/lib/admin/admin-theme'

describe('admin theme', () => {
  it('recognizes stored preferences', () => {
    expect(isAdminThemePreference('light')).toBe(true)
    expect(isAdminThemePreference('dark')).toBe(true)
    expect(isAdminThemePreference('system')).toBe(true)
    expect(isAdminThemePreference('sepia')).toBe(false)
    expect(isAdminThemePreference(null)).toBe(false)
  })

  it('resolves explicit and system preferences', () => {
    expect(resolveAdminTheme('light', true)).toBe('light')
    expect(resolveAdminTheme('dark', false)).toBe('dark')
    expect(resolveAdminTheme('system', true)).toBe('dark')
    expect(resolveAdminTheme('system', false)).toBe('light')
  })
})
