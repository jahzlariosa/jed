import type { AdminEditorContentKind } from '#/lib/cms/admin-preview'

/** Maps a `content_entries.kind` value to post vs page preview paths. */
export function contentEntryEditorKind(kind: string): AdminEditorContentKind {
  return kind === 'page' ? 'page' : 'post'
}

export function adminEditorPublicPath(
  editorKind: AdminEditorContentKind,
  slug: string,
): string {
  const trimmed = slug.trim()
  if (editorKind === 'page') {
    return `/${trimmed || 'page-slug'}`
  }
  return `/blog/${trimmed || 'post-slug'}`
}
