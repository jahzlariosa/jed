import { createFileRoute, useRouter } from '@tanstack/react-router'

import { ADMIN_LIST_ROUTE_CACHE } from '#/auth'
import {
  AdminListError,
  AdminListPending,
} from '#/components/admin/admin-list-route'
import { AuditScreen } from '#/components/admin/audit-screen'
import {
  parseAuditDirectoryQuery,
  type AuditDirectoryPageSize,
  type AuditRangePreset,
} from '#/lib/admin/audit-directory-query'
import { parseSiteWallTimeToUtcIso } from '#/lib/admin/audit-timezone'
import { listAuditLogFn } from '#/lib/cms/audit-fns'

export const Route = createFileRoute('/_authenticated/admin/audit')({
  ...ADMIN_LIST_ROUTE_CACHE,
  pendingComponent: AdminListPending,
  errorComponent: AdminListError,
  validateSearch: (search) => parseAuditDirectoryQuery(search),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => listAuditLogFn({ data: deps }),
  component: AdminAuditPage,
})

function AdminAuditPage() {
  const router = useRouter()
  const search = Route.useSearch()
  const page = Route.useLoaderData()
  const timeZone = page.siteTimezone

  function navigateAudit(
    patch: Partial<ReturnType<typeof parseAuditDirectoryQuery>>,
  ) {
    void router.navigate({
      to: '/admin/audit',
      search: {
        ...search,
        ...patch,
      },
    })
  }

  function localToUtcIso(local: string | undefined): string | undefined {
    if (!local?.trim()) {
      return undefined
    }
    return parseSiteWallTimeToUtcIso(local, timeZone) ?? undefined
  }

  return (
    <AuditScreen
      page={page}
      q={search.q ?? ''}
      action={search.action}
      actorId={search.actorId}
      targetType={search.targetType}
      from={search.from}
      to={search.to}
      preset={search.preset}
      onSearchChange={(q) => navigateAudit({ q, page: 1 })}
      onActionChange={(action) => navigateAudit({ action, page: 1 })}
      onActorChange={(actorId) => navigateAudit({ actorId, page: 1 })}
      onTargetTypeChange={(targetType) =>
        navigateAudit({ targetType, page: 1 })
      }
      onFromChange={(fromLocal) =>
        navigateAudit({
          from: localToUtcIso(fromLocal),
          preset: undefined,
          page: 1,
        })
      }
      onToChange={(toLocal) =>
        navigateAudit({
          to: localToUtcIso(toLocal),
          preset: undefined,
          page: 1,
        })
      }
      onPresetChange={(preset: AuditRangePreset) =>
        navigateAudit({
          preset,
          from: undefined,
          to: undefined,
          page: 1,
        })
      }
      onClearRange={() =>
        navigateAudit({
          preset: undefined,
          from: undefined,
          to: undefined,
          page: 1,
        })
      }
      onPageChange={(pageNum) => navigateAudit({ page: pageNum })}
      onPageSizeChange={(pageSize: AuditDirectoryPageSize) =>
        navigateAudit({ pageSize, page: 1 })
      }
    />
  )
}
