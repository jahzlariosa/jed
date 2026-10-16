import { afterEach, describe, expect, it, vi } from 'vitest'

import type { AccessDto } from '#/auth/permissions'
import { resolvePostSignInHref, signedInLandingPath } from '#/auth/redirect'

vi.mock('#/lib/cms/auth-redirect-settings.server', () => ({
  loadAuthRedirectSettings: vi.fn(),
}))

import { loadAuthRedirectSettings } from '#/lib/cms/auth-redirect-settings.server'

const adminAccess: AccessDto = {
  roles: ['admin'],
  permissions: ['admin.access'],
}

const memberAccess: AccessDto = {
  roles: ['member'],
  permissions: [],
}

describe('signedInLandingPath', () => {
  afterEach(() => {
    vi.mocked(loadAuthRedirectSettings).mockReset()
  })

  it('sends admins to redirect_after_sign_in_admin', async () => {
    vi.mocked(loadAuthRedirectSettings).mockResolvedValue({
      signInAdmin: '/admin',
      signInUser: '/',
      signUp: '/',
      passwordReset: '/account',
      signOut: '/login',
    })

    await expect(signedInLandingPath(adminAccess)).resolves.toBe('/admin')
  })

  it('sends members to redirect_after_sign_in_user', async () => {
    vi.mocked(loadAuthRedirectSettings).mockResolvedValue({
      signInAdmin: '/admin',
      signInUser: '/',
      signUp: '/',
      passwordReset: '/account',
      signOut: '/login',
    })

    await expect(signedInLandingPath(memberAccess)).resolves.toBe('/')
  })

  it('keeps root path for members without falling back to /account', async () => {
    vi.mocked(loadAuthRedirectSettings).mockResolvedValue({
      signInAdmin: '/admin',
      signInUser: '/',
      signUp: '/',
      passwordReset: '/account',
      signOut: '/login',
    })

    await expect(signedInLandingPath(memberAccess)).resolves.not.toBe(
      '/account',
    )
  })

  it('sends a role-only admin without admin.access to / so /admin cannot bounce them to /account', () => {
    const roleOnly: AccessDto = { roles: ['admin'], permissions: [] }
    expect(
      resolvePostSignInHref(roleOnly, undefined, {
        signInAdmin: '/admin',
        signInUser: '/',
      }),
    ).toBe('/')
  })

  it('sends a member with no redirect param to / even if settings still say /account', async () => {
    vi.mocked(loadAuthRedirectSettings).mockResolvedValue({
      signInAdmin: '/admin',
      signInUser: '/account',
      signUp: '/',
      passwordReset: '/account',
      signOut: '/login',
    })

    await expect(signedInLandingPath(memberAccess)).resolves.toBe('/')
    expect(
      resolvePostSignInHref(memberAccess, undefined, {
        signInAdmin: '/admin',
        signInUser: '/account',
      }),
    ).toBe('/')
  })
})
