export const EDITOR_SLUG_MAX = 120

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Lowercase hyphenated ASCII slug from a title (transliterated). */
export function slugifyEditorTitle(
  title: string,
  maxLength = EDITOR_SLUG_MAX,
): string {
  const ascii = title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  return ascii
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength)
}

export function isValidEditorSlug(value: string): boolean {
  return SLUG_RE.test(value)
}

/** Whether a new or draft entry should start with title-driven slug updates. */
export function shouldEnableSlugTitleSyncOnLoad(
  slugLockedPublished: boolean,
  title: string,
  slug: string,
): boolean {
  if (slugLockedPublished) {
    return false
  }
  const trimmed = slug.trim()
  if (!trimmed) {
    return true
  }
  return trimmed === slugifyEditorTitle(title)
}

export function nextAvailableEditorSlug(
  baseSlug: string,
  isTaken: (candidate: string) => boolean,
  maxLength = EDITOR_SLUG_MAX,
): string {
  const base = baseSlug.trim()
  if (!base) {
    throw new Error('Invalid slug')
  }
  if (!isTaken(base)) {
    return base
  }
  for (let suffix = 2; suffix < 10_000; suffix += 1) {
    const tail = `-${suffix}`
    const headMax = maxLength - tail.length
    if (headMax < 1) {
      break
    }
    const head = base.slice(0, headMax).replace(/-+$/, '')
    const candidate = `${head}${tail}`
    if (isValidEditorSlug(candidate) && !isTaken(candidate)) {
      return candidate
    }
  }
  throw new Error('Unable to allocate a unique slug')
}
