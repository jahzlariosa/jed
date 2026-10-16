import { ADMIN_DATABASE_PLAN_LIMIT_BYTES } from '#/lib/admin/database/constants'
import type {
  AdminDatabaseSnapshotDto,
  DatabaseActivityDto,
  DatabaseDiagramDto,
  DatabaseOverviewDto,
  DatabaseTableDto,
} from '#/lib/admin/database/types'

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : null
}

function asNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function asBoolean(value: unknown): boolean {
  return value === true
}

export function mapDatabaseOverview(raw: unknown): DatabaseOverviewDto {
  const row = asRecord(raw) ?? {}
  const bucketsRaw = Array.isArray(row.storageBuckets) ? row.storageBuckets : []
  return {
    databaseBytes: asNumber(row.databaseBytes),
    planLimitBytes: ADMIN_DATABASE_PLAN_LIMIT_BYTES,
    storageBuckets: bucketsRaw
      .map((item) => {
        const bucket = asRecord(item)
        if (!bucket) {
          return null
        }
        return {
          bucketId: asString(bucket.bucketId),
          objectCount: asNumber(bucket.objectCount),
          totalBytes: asNumber(bucket.totalBytes),
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null),
  }
}

export function mapDatabaseTables(raw: unknown): DatabaseTableDto[] {
  if (!Array.isArray(raw)) {
    return []
  }
  return raw
    .map((item) => {
      const row = asRecord(item)
      if (!row) {
        return null
      }
      const columnsRaw = Array.isArray(row.columns) ? row.columns : []
      const indexesRaw = Array.isArray(row.indexes) ? row.indexes : []
      return {
        schema: asString(row.schema) || 'public',
        name: asString(row.name),
        totalBytes: asNumber(row.totalBytes),
        tableBytes: asNumber(row.tableBytes),
        indexBytes: asNumber(row.indexBytes),
        estimatedRows: asNumber(row.estimatedRows),
        columns: columnsRaw
          .map((col) => {
            const column = asRecord(col)
            if (!column) {
              return null
            }
            return {
              name: asString(column.name),
              dataType: asString(column.dataType),
              isNullable: column.isNullable === true,
            }
          })
          .filter((col): col is NonNullable<typeof col> => col !== null),
        indexes: indexesRaw
          .map((idx) => {
            const index = asRecord(idx)
            if (!index) {
              return null
            }
            return {
              name: asString(index.name),
              definition: asString(index.definition),
            }
          })
          .filter((idx): idx is NonNullable<typeof idx> => idx !== null),
      }
    })
    .filter((table): table is NonNullable<typeof table> => table !== null)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function mapDatabaseDiagram(raw: unknown): DatabaseDiagramDto {
  const row = asRecord(raw) ?? {}
  const tables = Array.isArray(row.tables)
    ? row.tables.filter((t): t is string => typeof t === 'string')
    : []
  const relationshipsRaw = Array.isArray(row.relationships)
    ? row.relationships
    : []
  return {
    tables,
    relationships: relationshipsRaw
      .map((item) => {
        const rel = asRecord(item)
        if (!rel) {
          return null
        }
        return {
          fromTable: asString(rel.fromTable),
          fromColumn: asString(rel.fromColumn),
          toTable: asString(rel.toTable),
          toColumn: asString(rel.toColumn),
        }
      })
      .filter((rel): rel is NonNullable<typeof rel> => rel !== null),
  }
}

export function mapDatabaseActivity(raw: unknown): DatabaseActivityDto {
  const row = asRecord(raw) ?? {}
  const connectionsRaw = Array.isArray(row.connectionsByState)
    ? row.connectionsByState
    : []
  const slowRaw = Array.isArray(row.slowQueries) ? row.slowQueries : []
  return {
    connectionsByState: connectionsRaw
      .map((item) => {
        const conn = asRecord(item)
        if (!conn) {
          return null
        }
        return {
          state: asString(conn.state) || 'unknown',
          count: asNumber(conn.count),
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null),
    slowQueriesAvailable: asBoolean(row.slowQueriesAvailable),
    slowQueries: slowRaw
      .map((item) => {
        const query = asRecord(item)
        if (!query) {
          return null
        }
        return {
          queryId: asString(query.queryId),
          meanTimeMs: asNumber(query.meanTimeMs),
          calls: asNumber(query.calls),
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null),
  }
}

const EMPTY_ACTIVITY: DatabaseActivityDto = {
  connectionsByState: [],
  slowQueriesAvailable: false,
  slowQueries: [],
}

export function mapAdminDatabaseSnapshot(parts: {
  overview: unknown
  tables: unknown
  diagram: unknown
  activity: unknown
  activityError?: string
  loadedAt: Date
}): AdminDatabaseSnapshotDto {
  return {
    overview: mapDatabaseOverview(parts.overview),
    tables: mapDatabaseTables(parts.tables),
    diagram: mapDatabaseDiagram(parts.diagram),
    activity:
      parts.activityError != null
        ? EMPTY_ACTIVITY
        : mapDatabaseActivity(parts.activity),
    activityError: parts.activityError,
    loadedAt: parts.loadedAt.toISOString(),
  }
}
