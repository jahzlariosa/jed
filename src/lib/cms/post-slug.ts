import {
  EDITOR_SLUG_MAX,
  isValidEditorSlug,
  slugifyEditorTitle,
} from '#/lib/cms/editor-slug'

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function slugifyPostTitle(title: string): string {
  return slugifyEditorTitle(title, EDITOR_SLUG_MAX)
}

export function resolvePostSlug(slug: string, title: string): string {
  const trimmed = slug.trim()
  const candidate = (trimmed || slugifyPostTitle(title)).slice(0, 120)
  if (!candidate || !SLUG_RE.test(candidate)) {
    throw new Error('INVALID_SLUG')
  }
  return candidate
}

export function isValidPostSlug(value: string): boolean {
  return isValidEditorSlug(value)
}
