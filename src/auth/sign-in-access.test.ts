import { describe, expect, it, vi } from 'vitest'

import type { AccessDto } from '#/auth/permissions'
import { signedInLandingPath } from '#/auth/redirect'

vi.mock('#/lib/cms/auth-redirect-settings.server', () => ({
  loadAuthRedirectSettings: vi.fn(async () => ({
    signInAdmin: '/admin',
    signInUser: '/',
    signUp: '/',
    passwordReset: '/account',
    signOut: '/login',
  })),
}))

describe('post sign-in landing paths', () => {
  it('routes admins and members from site_settings', async () => {
    const admin: AccessDto = { roles: ['admin'], permissions: ['admin.access'] }
    const member: AccessDto = { roles: ['member'], permissions: [] }
    await expect(signedInLandingPath(admin)).resolves.toBe('/admin')
    await expect(signedInLandingPath(member)).resolves.toBe('/')
  })
})
