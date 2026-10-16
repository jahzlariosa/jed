import '@tanstack/react-start/server-only'

import { resolvePublicSiteName } from '#/lib/cms/brand-defaults'
import { SITE_NAME } from '#/lib/seo'
import { createServiceRoleClient } from '#/lib/supabase/service-role.server'

export type SeoBranding = {
  siteName: string
  titleTemplate: string
}

const DEFAULT_TEMPLATE = '{title} · {site}'

export async function loadSeoBranding(): Promise<SeoBranding> {
  try {
    const service = createServiceRoleClient()
    const { data, error } = await service
      .from('site_settings')
      .select('site_name, seo_title_template')
      .eq('id', 1)
      .maybeSingle()
    if (error) {
      console.error(error)
      return { siteName: SITE_NAME, titleTemplate: DEFAULT_TEMPLATE }
    }
    const siteName = resolvePublicSiteName(data?.site_name)
    const template = data?.seo_title_template?.trim() || DEFAULT_TEMPLATE
    return { siteName, titleTemplate: template }
  } catch (error) {
    console.error(error)
    return { siteName: SITE_NAME, titleTemplate: DEFAULT_TEMPLATE }
  }
}
