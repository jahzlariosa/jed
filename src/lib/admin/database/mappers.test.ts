import { describe, expect, it } from 'vitest'

import { ADMIN_DATABASE_PLAN_LIMIT_BYTES } from '#/lib/admin/database/constants'
import {
  mapAdminDatabaseSnapshot,
  mapDatabaseActivity,
  mapDatabaseDiagram,
  mapDatabaseOverview,
  mapDatabaseTables,
} from '#/lib/admin/database/mappers'

describe('admin database mappers', () => {
  it('maps overview and storage buckets', () => {
    const overview = mapDatabaseOverview({
      databaseBytes: 1_048_576,
      storageBuckets: [{ bucketId: 'media', objectCount: 2, totalBytes: 4096 }],
    })
    expect(overview.databaseBytes).toBe(1_048_576)
    expect(overview.planLimitBytes).toBe(ADMIN_DATABASE_PLAN_LIMIT_BYTES)
    expect(overview.storageBuckets[0]?.bucketId).toBe('media')
  })

  it('maps tables with columns and indexes', () => {
    const tables = mapDatabaseTables([
      {
        schema: 'public',
        name: 'posts',
        totalBytes: 100,
        tableBytes: 80,
        indexBytes: 20,
        estimatedRows: 5,
        columns: [{ name: 'id', dataType: 'uuid', isNullable: false }],
        indexes: [
          { name: 'posts_pkey', definition: 'CREATE UNIQUE INDEX ...' },
        ],
      },
    ])
    expect(tables[0]?.name).toBe('posts')
    expect(tables[0]?.columns[0]?.dataType).toBe('uuid')
    expect(tables[0]?.indexes[0]?.name).toBe('posts_pkey')
  })

  it('maps diagram relationships', () => {
    const diagram = mapDatabaseDiagram({
      tables: ['posts', 'profiles'],
      relationships: [
        {
          fromTable: 'posts',
          fromColumn: 'author_id',
          toTable: 'profiles',
          toColumn: 'user_id',
        },
      ],
    })
    expect(diagram.tables).toEqual(['posts', 'profiles'])
    expect(diagram.relationships[0]?.toTable).toBe('profiles')
  })

  it('maps activity with slow queries disabled', () => {
    const activity = mapDatabaseActivity({
      connectionsByState: [{ state: 'active', count: 3 }],
      slowQueriesAvailable: false,
      slowQueries: [],
    })
    expect(activity.connectionsByState[0]?.count).toBe(3)
    expect(activity.slowQueriesAvailable).toBe(false)
  })

  it('maps slow query stats by query id without query text', () => {
    const activity = mapDatabaseActivity({
      connectionsByState: [],
      slowQueriesAvailable: true,
      slowQueries: [{ queryId: '12345', meanTimeMs: 12.5, calls: 99 }],
    })
    expect(activity.slowQueries[0]?.queryId).toBe('12345')
    expect(activity.slowQueries[0]?.calls).toBe(99)
  })

  it('builds a full snapshot', () => {
    const loadedAt = new Date('2026-10-16T00:00:00.000Z')
    const snapshot = mapAdminDatabaseSnapshot({
      overview: { databaseBytes: 1, storageBuckets: [] },
      tables: [],
      diagram: { tables: [], relationships: [] },
      activity: {
        connectionsByState: [],
        slowQueriesAvailable: false,
        slowQueries: [],
      },
      loadedAt,
    })
    expect(snapshot.loadedAt).toBe(loadedAt.toISOString())
    expect(snapshot.overview.databaseBytes).toBe(1)
  })
})
