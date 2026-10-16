import '@tanstack/react-start/server-only'

import {
  normalizePublicMarketing,
  type PublicMarketing,
} from '#/lib/cms/public-marketing'
import {
  resolvePublicBrandHex,
  resolvePublicSiteName,
} from '#/lib/cms/brand-defaults'
import { createServiceRoleClient } from '#/lib/supabase/service-role.server'

type SiteRow = {
  site_name: string | null
  brand_hex: string | null
  contact_email: string | null
}

async function loadSiteSettings(): Promise<SiteRow | null> {
  try {
    const service = createServiceRoleClient()
    const { data, error } = await service
      .from('site_settings')
      .select('site_name, brand_hex, contact_email')
      .eq('id', 1)
      .maybeSingle()
    if (error) {
      console.error(error)
      return null
    }
    return data
  } catch (error) {
    console.error(error)
    return null
  }
}

export async function loadPublicMarketing(): Promise<PublicMarketing> {
  const row = await loadSiteSettings()
  const email = row?.contact_email?.trim()
  return normalizePublicMarketing({
    siteName: resolvePublicSiteName(row?.site_name),
    contactEmail: email && email.length > 0 ? email : null,
    brandHex: resolvePublicBrandHex(row?.brand_hex),
  })
}

export async function loadAuthBranding() {
  const row = await loadSiteSettings()
  return normalizePublicMarketing({
    siteName: resolvePublicSiteName(row?.site_name),
    contactEmail: null,
    brandHex: resolvePublicBrandHex(row?.brand_hex),
  })
}
