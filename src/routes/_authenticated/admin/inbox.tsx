import { createFileRoute, useRouter } from '@tanstack/react-router'

import { ADMIN_LIST_ROUTE_CACHE } from '#/auth'
import {
  ContactInboxError,
  ContactInboxScreen,
  ContactInboxSkeleton,
} from '#/components/admin/contact-inbox-screen'
import {
  parseContactInboxQuery,
  type ContactInboxPageSize,
  type ContactInboxTab,
} from '#/lib/admin/contact-inbox-query'
import { listContactMessagesFn } from '#/lib/cms/contact-inbox-fns'

export const Route = createFileRoute('/_authenticated/admin/inbox')({
  ...ADMIN_LIST_ROUTE_CACHE,
  pendingComponent: ContactInboxSkeleton,
  errorComponent: InboxErrorRoute,
  validateSearch: (search) => parseContactInboxQuery(search),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => listContactMessagesFn({ data: deps }),
  component: AdminInboxPage,
})

function InboxErrorRoute() {
  const router = useRouter()
  return <ContactInboxError onRetry={() => void router.invalidate()} />
}

function AdminInboxPage() {
  const router = useRouter()
  const search = Route.useSearch()
  const page = Route.useLoaderData()

  function navigateInbox(
    patch: Partial<ReturnType<typeof parseContactInboxQuery>>,
  ) {
    void router.navigate({
      to: '/admin/inbox',
      search: { ...search, ...patch },
      resetScroll: false,
    })
  }

  return (
    <ContactInboxScreen
      page={page}
      q={search.q ?? ''}
      tab={search.status}
      selectedId={search.id}
      onSearchChange={(q) => navigateInbox({ q, page: 1, id: undefined })}
      onTabChange={(status: ContactInboxTab) =>
        navigateInbox({ status, page: 1, id: undefined })
      }
      onSelect={(id) => navigateInbox({ id })}
      onPageChange={(pageNum) => navigateInbox({ page: pageNum })}
      onPageSizeChange={(pageSize: ContactInboxPageSize) =>
        navigateInbox({ pageSize, page: 1 })
      }
      onRefresh={() => void router.invalidate()}
    />
  )
}
