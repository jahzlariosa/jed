import {
  createMemoryHistory,
  createRouter,
  isRedirect,
} from '@tanstack/react-router'
import { describe, expect, it, vi } from 'vitest'

import { resolvePostSignInHref } from '#/auth/redirect'
import { signInDocumentHref } from '#/auth/sign-in-navigation'
import { Route as AdminRoute } from '#/routes/_authenticated/admin'
import { routeTree } from '#/routeTree.gen'

vi.mock('#/lib/cms/auth-redirect-settings.server', () => ({
  loadAuthRedirectSettings: vi.fn(),
}))

vi.mock('#/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('#/auth')>()
  return {
    ...actual,
    getAppShellFn: () =>
      Promise.resolve({
        user: { id: 'member-1', email: 'member@example.com' },
        access: { roles: ['member'], permissions: [] },
        mfa: {
          settings: { mfaEnabled: false, mfaPolicy: 'off' },
          aal: null,
          hasVerifiedFactor: false,
        },
      }),
  }
})

const memberSettings = { signInAdmin: '/admin', signInUser: '/' }

function createTestRouter(initialPath: string) {
  const history = createMemoryHistory({ initialEntries: [initialPath] })
  return createRouter({
    routeTree,
    history,
    origin: 'http://localhost',
    isServer: false,
    defaultPendingMinMs: 0,
    defaultPendingMs: 0,
  })
}

describe('member sign-in navigation', () => {
  it('resolves a member with no ?redirect to / and rejects an external href', () => {
    const href = resolvePostSignInHref(
      { roles: ['member'], permissions: [] },
      undefined,
      memberSettings,
    )
    expect(href).toBe('/')
    expect(signInDocumentHref(href)).toBe('/')
    expect(signInDocumentHref('https://evil.example/account')).toBeNull()
    expect(signInDocumentHref('/account')).toBe('/account')
  })

  it('follows the login document path to / and stays there on a fresh load', async () => {
    const href = signInDocumentHref(
      resolvePostSignInHref(
        { roles: ['member'], permissions: [] },
        undefined,
        memberSettings,
      ),
    )
    expect(href).toBe('/')
    if (!href) {
      return
    }

    const login = createTestRouter('/login')
    await login.load()
    await login.navigate({ href })
    expect(login.state.location.pathname).toBe('/')
    expect(
      login.state.matches.some((match) => match.routeId.includes('account')),
    ).toBe(false)

    const reloaded = createTestRouter(href)
    await reloaded.load()
    expect(reloaded.state.location.pathname).toBe('/')
    expect(reloaded.state.matches.map((match) => match.routeId)).not.toContain(
      '/_authenticated/account',
    )
  })

  it('sends a signed-in member who opens /admin to / rather than /account', async () => {
    try {
      AdminRoute.options.beforeLoad?.({
        context: {
          user: { id: 'member-1', email: 'member@example.com' },
          access: { roles: ['member'], permissions: [] },
        },
      } as never)
      throw new Error('expected a redirect')
    } catch (error) {
      expect(isRedirect(error)).toBe(true)
      if (!isRedirect(error)) {
        return
      }
      expect(error.options.to).toBe('/')
      expect(error.headers.get('Location')).not.toBe('/account')
    }

    const router = createTestRouter('/login')
    await router.load()
    await router.navigate({ to: '/admin' })
    expect(router.state.location.pathname).toBe('/')
    expect(
      router.state.matches.some((match) => match.routeId.includes('account')),
    ).toBe(false)
  })
})
