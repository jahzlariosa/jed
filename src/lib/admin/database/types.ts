export type DatabaseStorageBucketUsage = {
  bucketId: string
  objectCount: number
  totalBytes: number
}

export type DatabaseOverviewDto = {
  databaseBytes: number
  planLimitBytes: number
  storageBuckets: DatabaseStorageBucketUsage[]
}

export type DatabaseColumnDto = {
  name: string
  dataType: string
  isNullable: boolean
}

export type DatabaseIndexDto = {
  name: string
  definition: string
}

export type DatabaseTableDto = {
  schema: string
  name: string
  totalBytes: number
  tableBytes: number
  indexBytes: number
  estimatedRows: number
  columns: DatabaseColumnDto[]
  indexes: DatabaseIndexDto[]
}

export type DatabaseRelationshipDto = {
  fromTable: string
  fromColumn: string
  toTable: string
  toColumn: string
}

export type DatabaseDiagramDto = {
  tables: string[]
  relationships: DatabaseRelationshipDto[]
}

export type DatabaseConnectionStateDto = {
  state: string
  count: number
}

export type DatabaseSlowQueryDto = {
  queryId: string
  meanTimeMs: number
  calls: number
}

export type DatabaseActivityDto = {
  connectionsByState: DatabaseConnectionStateDto[]
  slowQueriesAvailable: boolean
  slowQueries: DatabaseSlowQueryDto[]
}

export type AdminDatabaseSnapshotDto = {
  overview: DatabaseOverviewDto
  tables: DatabaseTableDto[]
  diagram: DatabaseDiagramDto
  activity: DatabaseActivityDto
  /** Set when admin_database_activity fails but other RPCs succeeded. */
  activityError?: string
  loadedAt: string
}
