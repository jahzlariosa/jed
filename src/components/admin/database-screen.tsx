import {
  ChartPie,
  Pulse,
  CirclesThreePlus,
  Database,
  Table as TableIcon,
} from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import { AdminPageHeader } from '#/components/admin/admin-page-header'
import { AdminSectionBlock } from '#/components/admin/admin-section-block'
import { AdminTabPanel, AdminUrlTabs } from '#/components/admin/admin-url-tabs'
import { DatabaseDiagram } from '#/components/admin/database-diagram'
import { formatBytes } from '#/lib/admin/database/format-bytes'
import type { AdminDatabaseSnapshotDto } from '#/lib/admin/database/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const DATABASE_TABS = [
  { id: 'overview', label: 'Overview', icon: ChartPie },
  { id: 'tables', label: 'Tables', icon: TableIcon },
  { id: 'diagram', label: 'Diagram', icon: CirclesThreePlus },
  { id: 'activity', label: 'Activity', icon: Pulse },
] as const

export type DatabaseTabId = (typeof DATABASE_TABS)[number]['id']

export function DatabaseScreen({
  snapshot,
  activeTab,
}: {
  snapshot: AdminDatabaseSnapshotDto
  activeTab: DatabaseTabId
}) {
  const router = useRouter()
  const [expandedTable, setExpandedTable] = useState<string | null>(null)
  const { overview, tables, diagram, activity, activityError } = snapshot
  const usagePercent = Math.min(
    100,
    (overview.databaseBytes / overview.planLimitBytes) * 100,
  )

  function setTab(tab: DatabaseTabId) {
    void router.navigate({
      to: '/admin/database',
      search: { tab },
      replace: true,
      resetScroll: false,
    })
  }

  return (
    <div className="admin-page-body grid w-full gap-8">
      <AdminPageHeader
        title="Database"
        description="Read-only view of Postgres size, tables, relationships, and activity."
      />

      <AdminUrlTabs
        tabs={DATABASE_TABS}
        activeTab={activeTab}
        onTabChange={(tab) => setTab(tab as DatabaseTabId)}
        ariaLabel="Database sections"
      />

      <AdminTabPanel id="overview" activeTab={activeTab}>
        <AdminSectionBlock
          title="Database size"
          description="Compared to the default free tier limit for hosted Postgres."
        >
          <div className="admin-card grid gap-4 p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-2xl font-semibold tabular-nums">
                  {formatBytes(overview.databaseBytes)}
                </p>
                <p className="text-sm text-muted-foreground">
                  of {formatBytes(overview.planLimitBytes)} plan limit
                </p>
              </div>
              <p className="text-sm text-muted-foreground tabular-nums">
                {usagePercent.toFixed(1)}% used
              </p>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(usagePercent)}
              aria-label="Database size versus plan limit"
            >
              <div
                className="h-full rounded-full bg-primary transition-[width]"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>
        </AdminSectionBlock>

        <AdminSectionBlock
          title="Storage buckets"
          description="Object counts and bytes from Supabase storage."
        >
          <div className="admin-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bucket</TableHead>
                  <TableHead className="text-right">Objects</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.storageBuckets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground">
                      No storage objects found.
                    </TableCell>
                  </TableRow>
                ) : (
                  overview.storageBuckets.map((bucket) => (
                    <TableRow key={bucket.bucketId}>
                      <TableCell className="font-mono text-sm">
                        {bucket.bucketId}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {bucket.objectCount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatBytes(bucket.totalBytes)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </AdminSectionBlock>
      </AdminTabPanel>

      <AdminTabPanel id="tables" activeTab={activeTab}>
        <AdminSectionBlock
          title="Public tables"
          description="Size, row estimates, columns, and indexes."
        >
          <div className="grid gap-3">
            {tables.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No public tables were found.
              </p>
            ) : (
              tables.map((table) => {
                const open = expandedTable === table.name
                return (
                  <div key={table.name} className="admin-card overflow-hidden">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                      aria-expanded={open}
                      onClick={() => setExpandedTable(open ? null : table.name)}
                    >
                      <div>
                        <p className="font-medium">{table.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {table.estimatedRows.toLocaleString()} estimated rows
                        </p>
                      </div>
                      <div className="text-right text-sm tabular-nums text-muted-foreground">
                        <div>{formatBytes(table.totalBytes)} total</div>
                        <div className="text-xs">
                          {formatBytes(table.tableBytes)} table ·{' '}
                          {formatBytes(table.indexBytes)} indexes
                        </div>
                      </div>
                    </button>
                    {open ? (
                      <div className="border-t border-border px-5 py-4">
                        <p className="mb-2 text-sm font-medium">Columns</p>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Nullable</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {table.columns.map((column) => (
                                <TableRow key={column.name}>
                                  <TableCell className="font-mono text-xs">
                                    {column.name}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {column.dataType}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {column.isNullable ? 'Yes' : 'No'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        <p className="mb-2 mt-6 text-sm font-medium">Indexes</p>
                        {table.indexes.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No indexes on this table.
                          </p>
                        ) : (
                          <ul className="grid gap-2">
                            {table.indexes.map((index) => (
                              <li
                                key={index.name}
                                className="rounded-md border border-border bg-muted/30 px-3 py-2 font-mono text-xs"
                              >
                                <span className="font-semibold">
                                  {index.name}
                                </span>
                                <div className="mt-1 text-muted-foreground">
                                  {index.definition}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : null}
                  </div>
                )
              })
            )}
          </div>
        </AdminSectionBlock>
      </AdminTabPanel>

      <AdminTabPanel id="diagram" activeTab={activeTab}>
        <AdminSectionBlock
          title="Schema diagram"
          description="Foreign keys between public tables."
        >
          <DatabaseDiagram diagram={diagram} />
        </AdminSectionBlock>
      </AdminTabPanel>

      <AdminTabPanel id="activity" activeTab={activeTab}>
        {activityError ? (
          <div
            className="admin-card border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
            role="alert"
          >
            {activityError}
          </div>
        ) : null}
        <AdminSectionBlock
          title="Connections"
          description="Active sessions on this database."
        >
          <div className="admin-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>State</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activity.connectionsByState.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-muted-foreground">
                      No connection stats available.
                    </TableCell>
                  </TableRow>
                ) : (
                  activity.connectionsByState.map((row) => (
                    <TableRow key={row.state}>
                      <TableCell>{row.state}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.count.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </AdminSectionBlock>

        <AdminSectionBlock
          title="Slow queries"
          description="Top statements by mean time when pg_stat_statements is enabled."
        >
          {!activity.slowQueriesAvailable ? (
            <div className="admin-card p-5 text-sm text-muted-foreground">
              <Database
                className="mb-2 size-5 opacity-70"
                aria-hidden
                weight="regular"
              />
              pg_stat_statements is not enabled on this database. Ask your
              operator to enable the extension to see slow query stats here.
            </div>
          ) : activity.slowQueries.length === 0 ? (
            <div className="admin-card p-5 text-sm text-muted-foreground">
              No slow query samples yet. Stats appear after traffic runs on this
              database.
            </div>
          ) : (
            <div className="admin-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Query ID</TableHead>
                    <TableHead className="text-right">Mean (ms)</TableHead>
                    <TableHead className="text-right">Calls</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activity.slowQueries.map((row) => (
                    <TableRow
                      key={`${row.queryId}-${row.meanTimeMs}-${row.calls}`}
                    >
                      <TableCell className="max-w-xl font-mono text-xs">
                        {row.queryId || '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.meanTimeMs.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.calls.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </AdminSectionBlock>
      </AdminTabPanel>

      <p className="text-xs text-muted-foreground">
        Snapshot loaded at {new Date(snapshot.loadedAt).toLocaleString()}. Data
        refreshes about every minute.
      </p>
    </div>
  )
}
