import '@tanstack/react-start/server-only'

import { PERMISSIONS } from '#/auth/permissions'
import { requireCmsAccess } from '#/auth/admin-access.server'
import type { DomainContext } from '#/domain/types'

export async function getSiteSettingsDomain(_ctx: DomainContext) {
  await requireCmsAccess(PERMISSIONS.settingsRead)
  const supabase = _ctx.supabase
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle()
  if (error) {
    console.error(error)
    throw new Error('Unable to load settings')
  }
  return data
}
