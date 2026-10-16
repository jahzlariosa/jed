import type { ErrorComponentProps } from '@tanstack/react-router'
import { useRouter } from '@tanstack/react-router'

import {
  AdminTableError,
  AdminTableLoading,
} from '#/components/admin/admin-table-states'

export function AdminListPending() {
  return (
    <div className="w-full">
      <AdminTableLoading rows={8} />
    </div>
  )
}

export function AdminListError({ error }: ErrorComponentProps) {
  const router = useRouter()
  const message =
    error instanceof Error && error.message.length > 0
      ? error.message
      : 'Unable to load this page.'

  return (
    <div className="w-full">
      <AdminTableError
        message={message}
        onRetry={() => {
          void router.invalidate()
        }}
      />
    </div>
  )
}
