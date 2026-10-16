import '@tanstack/react-start/server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import {
  auditDirectoryPageCount,
  resolveAuditQueryBounds,
  type AuditDirectoryQuery,
} from '#/lib/admin/audit-directory-query'
import { escapeLike, quotePostgrestFilterValue } from '#/auth/validators'
import type { AuditLogRow } from '#/lib/cms/audit-fns'
import type { Database } from '#/lib/supabase/database.types'

export type AuditLogFilterOptions = {
  actions: string[]
  targetTypes: string[]
  actors: Array<{ userId: string; label: string }>
}

async function loadAuditFilterOptions(
  supabase: SupabaseClient<Database>,
): Promise<AuditLogFilterOptions> {
  const { data: recent, error } = await supabase
    .from('audit_log')
    .select('action, target_type, actor_user_id')
    .order('created_at', { ascending: false })
    .limit(400)
  if (error) {
    console.error(error)
    return { actions: [], targetTypes: [], actors: [] }
  }
  const actions = new Set<string>()
  const targetTypes = new Set<string>()
  const actorIds = new Set<string>()
  for (const row of recent ?? []) {
    if (row.action) {
      actions.add(row.action)
    }
    if (row.target_type) {
      targetTypes.add(row.target_type)
    }
    if (row.actor_user_id) {
      actorIds.add(row.actor_user_id)
    }
  }
  const ids = [...actorIds].slice(0, 40)
  let actors: AuditLogFilterOptions['actors'] = []
  if (ids.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, email, display_name')
      .in('user_id', ids)
    actors = (profiles ?? []).map((profile) => ({
      userId: profile.user_id,
      label: profile.display_name?.trim() || profile.email || profile.user_id,
    }))
  }
  return {
    actions: [...actions].sort(),
    targetTypes: [...targetTypes].sort(),
    actors,
  }
}

export async function fetchAuditDirectory(
  supabase: SupabaseClient<Database>,
  query: AuditDirectoryQuery,
  siteTimezone: string,
) {
  const bounds = resolveAuditQueryBounds(query)
  const offset = (query.page - 1) * query.pageSize
  let dbQuery = supabase
    .from('audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (query.action) {
    dbQuery = dbQuery.eq('action', query.action)
  }
  if (query.actorId) {
    dbQuery = dbQuery.eq('actor_user_id', query.actorId)
  }
  if (query.targetType) {
    dbQuery = dbQuery.eq('target_type', query.targetType)
  }
  if (query.q) {
    const escaped = escapeLike(query.q)
    const pattern = quotePostgrestFilterValue(`%${escaped}%`)
    dbQuery = dbQuery.or(
      `action.ilike.${pattern},target_type.ilike.${pattern},target_id.ilike.${pattern}`,
    )
  }
  if (bounds.from) {
    dbQuery = dbQuery.gte('created_at', bounds.from)
  }
  if (bounds.to) {
    dbQuery = dbQuery.lte('created_at', bounds.to)
  }

  const [listResult, filters] = await Promise.all([
    dbQuery.range(offset, offset + query.pageSize - 1),
    loadAuditFilterOptions(supabase),
  ])

  if (listResult.error) {
    console.error(listResult.error)
    throw new Error('Unable to load audit log')
  }

  const total = listResult.count ?? 0

  return {
    items: (listResult.data ?? []) as AuditLogRow[],
    total,
    page: query.page,
    pageSize: query.pageSize,
    pageCount: auditDirectoryPageCount(total, query.pageSize),
    siteTimezone,
    filters,
  }
}
