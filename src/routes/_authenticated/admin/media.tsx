import { ClientOnly, createFileRoute, useRouter } from '@tanstack/react-router'

import { MediaLibraryScreen } from '#/components/admin/media-library-screen.client'
import {
  LazyLoadError,
  LazyLoading,
  useLazyData,
} from '#/components/admin/lazy-page'
import { listMediaFn } from '#/lib/cms/functions'

export const Route = createFileRoute('/_authenticated/admin/media')({
  component: AdminMediaPage,
})

function AdminMediaPage() {
  const router = useRouter()
  const { data, error, retry } = useLazyData(
    () => listMediaFn({ data: { limit: 80 } }),
    'admin:media',
  )

  if (error) {
    return <LazyLoadError message={error} onRetry={retry} />
  }
  if (!data) {
    return <LazyLoading label="Loading media library" />
  }

  return (
    <ClientOnly fallback={<LazyLoading label="Loading media library" />}>
      <MediaLibraryScreen
        items={data.items}
        onReload={() => void router.invalidate()}
      />
    </ClientOnly>
  )
}
