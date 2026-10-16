import '@tanstack/react-start/server-only'

import { resolveAppUrl } from './app-url'

let cached: string | undefined

/** Validated once per process; throws on first use (and at boot via src/start.ts). */
export function getAppUrl(): string {
  cached ??= resolveAppUrl(process.env)
  return cached
}
