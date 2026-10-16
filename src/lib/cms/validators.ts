import { parseCanonicalUrlForSave } from '#/lib/url-security'

const SLUG_MAX = 120
const TITLE_MAX = 255
const TAG_MAX = 40
const TAGS_MAX = 20
const META_TITLE_MAX = 120
const META_DESC_MAX = 320
const PAGE_SIZE_MAX = 50

export type ContentKind = 'page' | 'post'
export type ContentStatus = 'draft' | 'published' | 'scheduled'

export function parseContentKind(value: unknown): ContentKind {
  const kind = String(value ?? '').trim()
  if (kind !== 'page' && kind !== 'post') {
    throw new Error('Invalid content type')
  }
  return kind
}

export function parseContentStatus(value: unknown): ContentStatus {
  const status = String(value ?? '').trim()
  if (status !== 'draft' && status !== 'published' && status !== 'scheduled') {
    throw new Error('Invalid status')
  }
  return status
}

export function parseSlug(value: unknown): string {
  const slug = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (slug.length < 1 || slug.length > SLUG_MAX) {
    throw new Error('Invalid slug')
  }
  return slug
}

export function parseTitle(value: unknown): string {
  const title = String(value ?? '').trim()
  if (title.length < 1 || title.length > TITLE_MAX) {
    throw new Error('Invalid title')
  }
  return title
}

export function parseTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  const tags = value
    .map((tag) =>
      String(tag ?? '')
        .trim()
        .slice(0, TAG_MAX),
    )
    .filter((tag) => tag.length > 0)
  return [...new Set(tags)].slice(0, TAGS_MAX)
}

export function parseContentListQuery(input: unknown) {
  const data =
    typeof input === 'object' && input !== null
      ? (input as Record<string, unknown>)
      : {}
  const page = Math.max(1, Number.parseInt(String(data.page ?? '1'), 10) || 1)
  const pageSize = Math.min(
    PAGE_SIZE_MAX,
    Math.max(1, Number.parseInt(String(data.pageSize ?? '25'), 10) || 25),
  )
  const q = String(data.q ?? '')
    .trim()
    .slice(0, 120)
  const kindRaw = String(data.kind ?? 'all').trim()
  const kind =
    kindRaw === 'page' || kindRaw === 'post' ? (kindRaw as ContentKind) : null
  const statusRaw = String(data.filter ?? data.status ?? 'all').trim()
  const status =
    statusRaw === 'draft' ||
    statusRaw === 'published' ||
    statusRaw === 'scheduled'
      ? (statusRaw as ContentStatus)
      : statusRaw === 'pages'
        ? 'pages'
        : statusRaw === 'posts'
          ? 'posts'
          : null
  const viewRaw = String(data.view ?? 'table').trim()
  const view = viewRaw === 'grid' ? 'grid' : 'table'
  return { page, pageSize, q, kind, status, view }
}

export function parseContentId(value: unknown): string {
  const id = String(value ?? '').trim()
  if (id === 'new') {
    return 'new'
  }
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    throw new Error('Invalid content id')
  }
  return id
}

export function parseBrandHex(value: unknown): string {
  const hex = String(value ?? '').trim()
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    throw new Error('Invalid accent color')
  }
  return hex.toUpperCase()
}

export function parseOptionalText(value: unknown, max: number): string | null {
  const text = String(value ?? '').trim()
  if (text.length === 0) {
    return null
  }
  return text.slice(0, max)
}

export function parseMetaTitle(value: unknown) {
  const text = parseOptionalText(value, META_TITLE_MAX)
  return text
}

export function parseMetaDescription(value: unknown) {
  return parseOptionalText(value, META_DESC_MAX)
}

export function parseCanonicalUrl(value: unknown): string | null {
  return parseCanonicalUrlForSave(
    value === null || value === undefined ? null : String(value).trim() || null,
  )
}
