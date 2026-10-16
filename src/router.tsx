import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { createIsomorphicFn } from '@tanstack/react-start'
import { requireRequestSsrNonce } from '#/lib/ssr-nonce.server'
import { NotFoundPage } from '#/components/errors/not-found'
import { RouteErrorPage } from '#/components/errors/route-error'
import { routeTree } from './routeTree.gen'

const resolveSsrNonce = createIsomorphicFn()
  .server(() => requireRequestSsrNonce())
  .client(() => undefined)

// Per-request CSP nonce: bound on the Request in src/start.ts before getRouter().
export function getRouter() {
  const nonce = resolveSsrNonce()
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 60_000,
    defaultPendingMs: 250,
    defaultPendingMinMs: 500,
    defaultGcTime: 300_000,
    defaultErrorComponent: RouteErrorPage,
    defaultNotFoundComponent: NotFoundPage,
    // The error UI shows fixed copy only; the real error is logged here (server and browser).
    defaultOnCatch: (error) => {
      console.error(error)
    },
    ssr: nonce ? { nonce } : undefined,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
