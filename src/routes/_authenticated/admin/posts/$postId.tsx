import { ClientOnly, createFileRoute, notFound } from '@tanstack/react-router'
import { z } from 'zod'

import { PostEditorScreen } from '#/components/admin/post-editor-screen.client'
import { adminTabSearchSchema } from '#/lib/admin/admin-tab-search'
import { getAdminPostFn } from '#/lib/cms/posts-admin-fns'

const postEditorSearchSchema = adminTabSearchSchema([
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

export const Route = createFileRoute('/_authenticated/admin/posts/$postId')({
  validateSearch: (search) => postEditorSearchSchema.parse(search),
  loaderDeps: () => ({}),
  loader: async ({ params }) => {
    const { postId } = params
    if (postId === 'new') {
      return { row: null, isNew: true }
    }
    const id = z.string().uuid().safeParse(postId)
    if (!id.success) {
      throw notFound()
    }
    const row = await getAdminPostFn({ data: { id: id.data } })
    return { row, isNew: false }
  },
  component: PostEditorPage,
})

function PostEditorPage() {
  const { row, isNew } = Route.useLoaderData()
  return (
    <ClientOnly fallback={<EditorFallback />}>
      <PostEditorScreen initial={row} isNew={isNew} />
    </ClientOnly>
  )
}
