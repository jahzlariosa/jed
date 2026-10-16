import '@tanstack/react-start/server-only'
import { getRequest } from '@tanstack/react-start/server'

const requestSsrNonce = new WeakMap<Request, string>()

/** Bind the CSP / SSR nonce before any code may call `getRouter()`. */
export function bindRequestSsrNonce(request: Request, nonce: string): void {
  requestSsrNonce.set(request, nonce)
}

export function readRequestSsrNonce(): string | undefined {
  try {
    const request = getRequest()
    return requestSsrNonce.get(request)
  } catch {
    return undefined
  }
}

export function requireRequestSsrNonce(): string {
  const nonce = readRequestSsrNonce()
  if (!nonce) {
    throw new Error('SSR nonce is not bound to the current request')
  }
  return nonce
}
