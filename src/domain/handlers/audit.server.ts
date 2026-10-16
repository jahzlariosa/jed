import '@tanstack/react-start/server-only'

import { assertDomainAdmin } from '#/domain/helpers/admin-domain.server'
import {
  parseAuditDirectoryQuery,
  type AuditDirectoryQuery,
} from '#/lib/admin/audit-directory-query'
import { fetchAuditDirectory } from '#/lib/admin/audit-directory.server'
import { resolveSiteTimezoneForUse } from '#/lib/iana-timezones'
import type { DomainContext } from '#/domain/types'

export type AuditListInput = AuditDirectoryQuery

export async function listAuditLogDomain(
  ctx: DomainContext,
  input: AuditListInput,
) {
  assertDomainAdmin(ctx)
  const query = parseAuditDirectoryQuery(input)
  const { data: settings } = await ctx.supabase
    .from('site_settings')
    .select('timezone')
    .eq('id', 1)
    .maybeSingle()
  const siteTimezone = resolveSiteTimezoneForUse(settings?.timezone)
  return fetchAuditDirectory(ctx.supabase, query, siteTimezone)
}
