import '@tanstack/react-start/server-only'

import {
  ApiRateLimitError,
  assertApiRateLimit,
} from '#/lib/api/rate-limit-api.server'

export function assertPublicSearchRateLimit(request: Request): void {
  try {
    assertApiRateLimit({
      request,
      action: 'public-search',
      limit: 120,
      windowMs: 60_000,
    })
  } catch (error) {
    if (error instanceof ApiRateLimitError) {
      throw new Error('Too many requests')
    }
    throw error
  }
}

export function assertPublicOpenApiRateLimit(request: Request): void {
  try {
    assertApiRateLimit({
      request,
      action: 'public-openapi',
      limit: 120,
      windowMs: 60_000,
    })
  } catch (error) {
    if (error instanceof ApiRateLimitError) {
      throw new Error('Too many requests')
    }
    throw error
  }
}
