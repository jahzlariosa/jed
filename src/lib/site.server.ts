import '@tanstack/react-start/server-only'

import { getAppUrl } from './app-url.server'

/**
 * Public origin used for canonical and og:url links. Shares the validated `APP_URL` from
 * `getAppUrl()` (never the request Host header, so a spoofed Host cannot poison cached public
 * HTML). Returns undefined if it cannot be resolved: canonical/og:url are then omitted rather
 * than failing the page (a missing/invalid production `APP_URL` already fails requests in
 * `src/start.ts`).
 */
export function getSiteUrl(): string | undefined {
  try {
    return getAppUrl()
  } catch (error) {
    console.error('Site URL unavailable; canonical links are disabled:', error)
    return undefined
  }
}
