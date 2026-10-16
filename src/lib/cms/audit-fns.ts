import { createServerFn } from '@tanstack/react-start'

import { requireAdminRead } from '#/auth/admin-access.server'
import { parseAuditDirectoryQuery } from '#/lib/admin/audit-directory-query'
import { fetchAuditDirectory } from '#/lib/admin/audit-directory.server'
import { resolveSiteTimezoneForUse } from '#/lib/iana-timezones'
import { markPrivateNoStore } from '#/auth/session.server'
import type { Tables } from '#/lib/supabase/database.types'

export type AuditLogRow = Tables<'audit_log'>

export type AuditLogPage = Awaited<ReturnType<typeof fetchAuditDirectory>>

export const listAuditLogFn = createServerFn({ method: 'GET' })
  .validator((input: unknown) => parseAuditDirectoryQuery(input))
  .handler(async ({ data }) => {
    markPrivateNoStore()
    const { supabase } = await requireAdminRead()
    const { data: settings } = await supabase
      .from('site_settings')
      .select('timezone')
      .eq('id', 1)
      .maybeSingle()
    const siteTimezone = resolveSiteTimezoneForUse(settings?.timezone)
    return fetchAuditDirectory(supabase, data, siteTimezone)
  })
