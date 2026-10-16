import { createServerFn } from '@tanstack/react-start'

import { requireAdminRead, requireAdminWrite } from '#/auth/admin-access.server'
import { safeInternalPath } from '#/auth/path'
import { markPrivateNoStore } from '#/auth/session.server'

import { writeAuditLog } from '#/lib/cms/audit.server'
import {
  detectRedirectCycle,
  escapeCsvField,
  parseRedirectCsvRows,
} from '#/lib/cms/redirect-csv'
import { clearRedirectCache } from '#/lib/seo/redirect-cache.server'
import { createServiceRoleClient } from '#/lib/supabase/service-role.server'
import type { Tables } from '#/lib/supabase/database.types'

export type UrlRedirectRow = Tables<'url_redirects'>

function parseRedirectPath(value: unknown, label: string) {
  const path = typeof value === 'string' ? value.trim() : ''
  const safe = safeInternalPath(path, null)
  if (!safe) {
    throw new Error(`Invalid ${label}`)
  }
  return safe
}

export const listUrlRedirectsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    markPrivateNoStore()
    const { supabase } = await requireAdminRead()
    const { data, error } = await supabase
      .from('url_redirects')
      .select('*')
      .order('from_path', { ascending: true })
    if (error) {
      console.error(error)
      throw new Error('Unable to load redirects')
    }
    return data ?? []
  },
)

export const saveUrlRedirectFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => {
    if (typeof input !== 'object' || input === null) {
      throw new Error('Unable to save redirect')
    }
    const raw = input as Record<string, unknown>
    const status = Number(raw.statusCode)
    const statusCode = status === 410 ? 410 : status === 302 ? 302 : 301
    const toPathRaw = String(raw.toPath ?? '').trim()
    const toPath =
      statusCode === 410
        ? toPathRaw || '/'
        : parseRedirectPath(raw.toPath, 'to path')
    return {
      id: typeof raw.id === 'string' ? raw.id : undefined,
      fromPath: parseRedirectPath(raw.fromPath, 'from path'),
      toPath,
      statusCode,
      enabled: raw.enabled !== false,
    }
  })
  .handler(async ({ data }) => {
    markPrivateNoStore()
    const { user, supabase } = await requireAdminWrite()
    const row = {
      from_path: data.fromPath,
      to_path: data.toPath,
      status_code: data.statusCode,
      enabled: data.enabled,
      updated_at: new Date().toISOString(),
    }
    if (data.fromPath === data.toPath) {
      return { error: 'This redirect would create a loop.' }
    }
    const { data: existingRedirects } = await supabase
      .from('url_redirects')
      .select('id, from_path, to_path')
    const cycleEdges = [
      ...(existingRedirects ?? [])
        .filter((row) => row.id !== data.id)
        .map((row) => ({ from: row.from_path, to: row.to_path })),
      { from: data.fromPath, to: data.toPath },
    ]
    if (detectRedirectCycle(cycleEdges)) {
      return { error: 'This redirect would create a loop.' }
    }
    if (data.id) {
      const { error } = await supabase
        .from('url_redirects')
        .update(row)
        .eq('id', data.id)
      if (error) {
        console.error(error)
        return { error: 'Unable to save redirect' }
      }
      await writeAuditLog(supabase, {
        actorUserId: user.id,
        action: 'redirect.update',
        targetType: 'url_redirect',
        targetId: data.id,
        metadata: { from: data.fromPath },
      })
      clearRedirectCache()
      return { ok: true as const }
    }
    const { data: existing } = await supabase
      .from('url_redirects')
      .select('id')
      .eq('from_path', data.fromPath)
      .maybeSingle()
    if (existing) {
      return { error: 'A redirect from this path already exists.' }
    }
    const { data: inserted, error } = await supabase
      .from('url_redirects')
      .insert(row)
      .select('id')
      .single()
    if (error) {
      console.error(error)
      return { error: 'Unable to create redirect' }
    }
    await writeAuditLog(supabase, {
      actorUserId: user.id,
      action: 'redirect.create',
      targetType: 'url_redirect',
      targetId: inserted.id,
      metadata: { from: data.fromPath },
    })
    clearRedirectCache()
    return { ok: true as const }
  })

export const exportUrlRedirectsCsvFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  markPrivateNoStore()
  const { supabase } = await requireAdminRead()
  const { data, error } = await supabase
    .from('url_redirects')
    .select('from_path, to_path, status_code, enabled, is_external')
    .order('from_path', { ascending: true })
  if (error) {
    console.error(error)
    throw new Error('Unable to export redirects')
  }
  const lines = ['from_path,to_path,status_code,enabled,is_external']
  for (const row of data ?? []) {
    lines.push(
      [
        escapeCsvField(row.from_path),
        escapeCsvField(row.to_path),
        String(row.status_code),
        row.enabled ? 'true' : 'false',
        row.is_external ? 'true' : 'false',
      ].join(','),
    )
  }
  return { csv: `${lines.join('\n')}\n` }
})

export const importUrlRedirectsCsvFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => {
    if (typeof input !== 'object' || input === null) {
      throw new Error('Unable to import redirects')
    }
    const csv = String((input as Record<string, unknown>).csv ?? '')
    if (csv.length > 200_000) {
      throw new Error('CSV file is too large')
    }
    return { csv }
  })
  .handler(async ({ data }) => {
    markPrivateNoStore()
    const { user, supabase } = await requireAdminWrite()
    const { data: settings } = await supabase
      .from('site_settings')
      .select('redirect_external_hosts')
      .eq('id', 1)
      .maybeSingle()
    const allowHosts = Array.isArray(settings?.redirect_external_hosts)
      ? (settings.redirect_external_hosts as string[])
      : []
    const parsed = parseRedirectCsvRows(data.csv, allowHosts, 1000)
    if ('error' in parsed) {
      return { error: parsed.error }
    }
    const { data: existingRows } = await supabase
      .from('url_redirects')
      .select('from_path, to_path')
    const edges = [
      ...(existingRows ?? []).map((row) => ({
        from: row.from_path,
        to: row.to_path,
      })),
      ...parsed.rows.map((row) => ({
        from: row.fromPath,
        to: row.toPath,
      })),
    ]
    if (detectRedirectCycle(edges)) {
      return { error: 'This redirect would create a loop.' }
    }
    const service = createServiceRoleClient()
    const payload = parsed.rows.map((row) => ({
      from_path: row.fromPath,
      to_path: row.toPath,
      status_code: row.statusCode,
      enabled: row.enabled,
      is_external: row.isExternal,
    }))
    const { data: importedCount, error } = await service.rpc(
      'import_url_redirects_csv',
      { rows: payload },
    )
    if (error) {
      console.error(error)
      return { error: 'Unable to import redirects' }
    }
    await writeAuditLog(supabase, {
      actorUserId: user.id,
      action: 'redirect.import',
      targetType: 'url_redirect',
      targetId: 'bulk',
      metadata: { imported: importedCount ?? parsed.rows.length },
    })
    clearRedirectCache()
    return { ok: true as const, imported: importedCount ?? parsed.rows.length }
  })

export const deleteUrlRedirectFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => {
    if (typeof input !== 'object' || input === null) {
      throw new Error('Unable to delete redirect')
    }
    return { id: String((input as Record<string, unknown>).id ?? '') }
  })
  .handler(async ({ data }) => {
    markPrivateNoStore()
    const { user, supabase } = await requireAdminWrite()
    const { error } = await supabase
      .from('url_redirects')
      .delete()
      .eq('id', data.id)
    if (error) {
      console.error(error)
      return { error: 'Unable to delete redirect' }
    }
    await writeAuditLog(supabase, {
      actorUserId: user.id,
      action: 'redirect.delete',
      targetType: 'url_redirect',
      targetId: data.id,
    })
    clearRedirectCache()
    return { ok: true as const }
  })
