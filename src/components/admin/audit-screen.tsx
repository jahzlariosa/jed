import type {
  AuditDirectoryPageSize,
  AuditRangePreset,
} from '#/lib/admin/audit-directory-query'
import { auditWallInputsFromQuery } from '#/lib/admin/audit-directory-query'
import type { AuditLogPage } from '#/lib/cms/audit-fns'
import { AdminPageHeader } from '#/components/admin/admin-page-header'
import { AdminDirectoryPagination } from '#/components/admin/admin-directory-pagination'
import { AuditToolbar } from '#/components/admin/audit-toolbar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const dateFormat = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function actorLabel(
  actorUserId: string | null,
  filters: AuditLogPage['filters'],
): string {
  if (!actorUserId) {
    return 'System'
  }
  const match = filters.actors.find((actor) => actor.userId === actorUserId)
  return match?.label ?? actorUserId
}

export function AuditScreen({
  page,
  q,
  action,
  actorId,
  targetType,
  from,
  to,
  preset,
  onSearchChange,
  onActionChange,
  onActorChange,
  onTargetTypeChange,
  onFromChange,
  onToChange,
  onPresetChange,
  onClearRange,
  onPageChange,
  onPageSizeChange,
}: {
  page: AuditLogPage
  q: string
  action?: string
  actorId?: string
  targetType?: string
  from?: string
  to?: string
  preset?: AuditRangePreset
  onSearchChange: (q: string) => void
  onActionChange: (action: string | undefined) => void
  onActorChange: (actorId: string | undefined) => void
  onTargetTypeChange: (targetType: string | undefined) => void
  onFromChange: (from: string | undefined) => void
  onToChange: (to: string | undefined) => void
  onPresetChange: (preset: AuditRangePreset) => void
  onClearRange: () => void
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: AuditDirectoryPageSize) => void
}) {
  const wall = auditWallInputsFromQuery(
    {
      q,
      role: undefined,
      page: page.page,
      pageSize: page.pageSize,
      action,
      actorId,
      targetType,
      from,
      to,
      preset,
    },
    page.siteTimezone,
  )

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        title="Audit log"
        description="A record of sensitive actions taken in admin."
      />
      <AuditToolbar
        q={q}
        action={action}
        actorId={actorId}
        targetType={targetType}
        fromLocal={preset ? '' : wall.fromLocal}
        toLocal={preset ? '' : wall.toLocal}
        preset={preset}
        siteTimezone={page.siteTimezone}
        filters={page.filters}
        onSearchChange={onSearchChange}
        onActionChange={onActionChange}
        onActorChange={onActorChange}
        onTargetTypeChange={onTargetTypeChange}
        onFromLocalChange={(value) => onFromChange(value || undefined)}
        onToLocalChange={(value) => onToChange(value || undefined)}
        onPresetChange={onPresetChange}
        onClearRange={onClearRange}
      />
      <div className="admin-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {page.items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  No events match these filters.
                </TableCell>
              </TableRow>
            ) : (
              page.items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {dateFormat.format(new Date(row.created_at))}
                  </TableCell>
                  <TableCell className="text-xs">
                    {actorLabel(row.actor_user_id, page.filters)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {row.action}
                  </TableCell>
                  <TableCell className="text-xs">
                    {row.target_type}
                    {row.target_id ? ` · ${row.target_id}` : ''}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <AdminDirectoryPagination
        page={page.page}
        pageSize={page.pageSize}
        pageCount={page.pageCount}
        total={page.total}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  )
}
