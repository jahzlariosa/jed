import { ClientOnly, createFileRoute } from '@tanstack/react-router'

import { ContentEditorScreen } from '#/components/admin/content-editor-screen.client'
import { adminTabSearchSchema } from '#/lib/admin/admin-tab-search'
import { getContentFn } from '#/lib/cms/functions'

const contentEditorSearchSchema = adminTabSearchSchema([
  'content',
  'seo',
  'settings',
] as const)

function EditorFallback() {
  return (
    <p className="text-sm text-muted-foreground" role="status">
      Loading editor…
    </p>
  )
}

export const Route = createFileRoute(
  '/_authenticated/admin/content/$contentId',
)({
  validateSearch: (search) => contentEditorSearchSchema.parse(search),
  loaderDeps: () => ({}),
  loader: ({ params }) => getContentFn({ data: { id: params.contentId } }),
  component: ContentEditorPage,
})

function ContentEditorPage() {
  const initial = Route.useLoaderData()
  return (
    <ClientOnly fallback={<EditorFallback />}>
      <ContentEditorScreen initial={initial} />
    </ClientOnly>
  )
}
