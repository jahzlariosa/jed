import { createServerFn } from '@tanstack/react-start'

import type { PublicMarketing } from '#/lib/cms/public-marketing'
import {
  loadAuthBranding,
  loadPublicMarketing,
} from '#/lib/cms/public-marketing.server'

/** Public marketing copy (site name). Safe to cache on `/` with staleTime Infinity. */
export const getPublicMarketingFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<PublicMarketing> => loadPublicMarketing(),
)

/** Auth pages: same site name, always no-store at the route layer. */
export const getAuthBrandingFn = createServerFn({ method: 'GET' }).handler(
  async () => loadAuthBranding(),
)
