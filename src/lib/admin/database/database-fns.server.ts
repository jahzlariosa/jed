import '@tanstack/react-start/server-only'

import { requireAdminRead } from '#/auth/admin-access.server'
import { ADMIN_DATABASE_CACHE_TTL_MS } from '#/lib/admin/database/constants'
import {
  databaseActivityLoadError,
  databaseInsightLoadError,
} from '#/lib/admin/database/database-insight-errors'
import { mapAdminDatabaseSnapshot } from '#/lib/admin/database/mappers'
import type { AdminDatabaseSnapshotDto } from '#/lib/admin/database/types'
import { createServiceRoleClient } from '#/lib/supabase/service-role.server'

let cached: { value: AdminDatabaseSnapshotDto; loadedAt: number } | null = null

export function clearAdminDatabaseCache(): void {
  cached = null
}

async function fetchAdminDatabaseSnapshot(): Promise<AdminDatabaseSnapshotDto> {
  const service = createServiceRoleClient()
  const [overviewRes, tablesRes, diagramRes, activityRes] = await Promise.all([
    service.rpc('admin_database_overview'),
    service.rpc('admin_database_tables'),
    service.rpc('admin_database_diagram'),
    service.rpc('admin_database_activity'),
  ])

  if (overviewRes.error) {
    console.error(overviewRes.error)
    throw new Error(databaseInsightLoadError(overviewRes.error))
  }
  if (tablesRes.error) {
    console.error(tablesRes.error)
    throw new Error(databaseInsightLoadError(tablesRes.error))
  }
  if (diagramRes.error) {
    console.error(diagramRes.error)
    throw new Error(databaseInsightLoadError(diagramRes.error))
  }

  let activityError: string | undefined
  let activityData: unknown = activityRes.data
  if (activityRes.error) {
    console.error(activityRes.error)
    activityError = databaseActivityLoadError(activityRes.error)
    activityData = null
  }

  return mapAdminDatabaseSnapshot({
    overview: overviewRes.data,
    tables: tablesRes.data,
    diagram: diagramRes.data,
    activity: activityData,
    activityError,
    loadedAt: new Date(),
  })
}

export async function loadAdminDatabaseSnapshot(): Promise<AdminDatabaseSnapshotDto> {
  const now = Date.now()
  if (cached && now - cached.loadedAt < ADMIN_DATABASE_CACHE_TTL_MS) {
    return cached.value
  }
  const value = await fetchAdminDatabaseSnapshot()
  cached = { value, loadedAt: now }
  return value
}

export async function loadAdminDatabaseWithAuth(): Promise<AdminDatabaseSnapshotDto> {
  await requireAdminRead()
  return loadAdminDatabaseSnapshot()
}
