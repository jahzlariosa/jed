import {
  createIsomorphicFn,
  getGlobalStartContext,
} from '@tanstack/react-start'

export const getScriptNonce = createIsomorphicFn()
  .server(() => {
    const context: unknown = getGlobalStartContext()
    if (
      typeof context === 'object' &&
      context !== null &&
      'nonce' in context &&
      typeof context.nonce === 'string'
    ) {
      return context.nonce
    }
    return undefined
  })
  .client(() => {
    if (typeof document === 'undefined') {
      return undefined
    }
    return (
      document
        .querySelector('meta[property="csp-nonce"]')
        ?.getAttribute('content') ?? undefined
    )
  })
