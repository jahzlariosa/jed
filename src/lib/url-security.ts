export const CMS_PUBLIC_MEDIA_PATH = '/storage/v1/object/public/media/'
export const AVATARS_PUBLIC_PATH = '/storage/v1/object/public/avatars/'
export const MAX_URL_LENGTH = 512

export const CANONICAL_URL_SAVE_ERROR =
  'Canonical URL must be a valid https link.'
export const SOCIAL_IMAGE_URL_SAVE_ERROR =
  'Social image URL must be a valid https link on this site media storage.'
export const ORG_LOGO_URL_SAVE_ERROR =
  'Organization logo URL must be a valid https link on this site media storage.'
export const COVER_IMAGE_URL_SAVE_ERROR =
  'Cover image URL must be a valid https link on this site media storage.'

export function supabaseProjectBase(): URL | null {
  const raw = import.meta.env.VITE_SUPABASE_URL?.trim()
  if (!raw) {
    return null
  }
  try {
    return new URL(raw.replace(/\/$/, ''))
  } catch {
    return null
  }
}

function urlHasCredentials(url: URL): boolean {
  return Boolean(url.username || url.password)
}

function parseHttpsUrl(value: string): URL | null {
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > MAX_URL_LENGTH) {
    return null
  }
  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return null
  }
  if (url.protocol !== 'https:') {
    return null
  }
  if (!url.hostname || urlHasCredentials(url)) {
    return null
  }
  return url
}

function resolveSupabasePublicObjectUrl(
  src: string,
  storagePathPrefix: string,
  relativeShortcutPrefix?: string,
): URL | null {
  const trimmed = src.trim()
  if (!trimmed || trimmed.length > MAX_URL_LENGTH) {
    return null
  }
  const project = supabaseProjectBase()
  if (!project) {
    return null
  }
  try {
    let url: URL
    if (relativeShortcutPrefix && trimmed.startsWith(relativeShortcutPrefix)) {
      const objectPath = trimmed.slice(relativeShortcutPrefix.length)
      url = new URL(`${storagePathPrefix}${objectPath}`, project.origin)
    } else if (trimmed.startsWith('/')) {
      url = new URL(trimmed, `${project.origin}/`)
    } else {
      url = new URL(trimmed)
    }
    if (urlHasCredentials(url)) {
      return null
    }
    return url
  } catch {
    return null
  }
}

function normalizeSupabasePublicObjectUrl(
  src: string,
  storagePathPrefix: string,
  relativeShortcutPrefix?: string,
): string | null {
  const url = resolveSupabasePublicObjectUrl(
    src,
    storagePathPrefix,
    relativeShortcutPrefix,
  )
  if (!url) {
    return null
  }
  const project = supabaseProjectBase()
  if (!project) {
    return null
  }
  if (url.protocol !== 'https:') {
    return null
  }
  if (url.origin !== project.origin) {
    return null
  }
  if (!url.pathname.startsWith(storagePathPrefix)) {
    return null
  }
  return url.href
}

export function isAllowedSupabasePublicObjectUrl(
  src: string,
  storagePathPrefix: string,
  relativeShortcutPrefix?: string,
): boolean {
  return (
    normalizeSupabasePublicObjectUrl(
      src,
      storagePathPrefix,
      relativeShortcutPrefix,
    ) !== null
  )
}

export function isAllowedHttpsUrl(value: string): boolean {
  return parseHttpsUrl(value) !== null
}

export function isAllowedCmsImageSrc(src: string): boolean {
  return isAllowedSupabasePublicObjectUrl(src, CMS_PUBLIC_MEDIA_PATH, '/media/')
}

export function isAllowedAvatarSrc(src: string): boolean {
  return isAllowedSupabasePublicObjectUrl(src, AVATARS_PUBLIC_PATH)
}

export function sanitizeCanonicalUrl(
  value: string | null | undefined,
): string | null {
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }
  return parseHttpsUrl(trimmed)?.href ?? null
}

export function sanitizeCmsImageUrl(
  value: string | null | undefined,
): string | null {
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }
  return normalizeSupabasePublicObjectUrl(
    trimmed,
    CMS_PUBLIC_MEDIA_PATH,
    '/media/',
  )
}

export function sanitizeAvatarUrl(
  value: string | null | undefined,
): string | null {
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }
  return normalizeSupabasePublicObjectUrl(trimmed, AVATARS_PUBLIC_PATH)
}

export function storedCmsImageUrlHiddenFromPublic(
  value: string | null | undefined,
): boolean {
  if (typeof value !== 'string') {
    return false
  }
  const trimmed = value.trim()
  if (!trimmed) {
    return false
  }
  return sanitizeCmsImageUrl(trimmed) === null
}

export function parseCanonicalUrlForSave(
  value: string | null | undefined,
): string | null {
  if (value === null || value === undefined) {
    return null
  }
  const trimmed = String(value).trim()
  if (!trimmed) {
    return null
  }
  if (trimmed.length > MAX_URL_LENGTH) {
    throw new Error(CANONICAL_URL_SAVE_ERROR)
  }
  const url = parseHttpsUrl(trimmed)
  if (!url) {
    throw new Error(CANONICAL_URL_SAVE_ERROR)
  }
  return url.href
}

export function parseCmsImageUrlForSave(
  value: string | null | undefined,
  fieldError: string,
): string | null {
  if (value === null || value === undefined) {
    return null
  }
  const trimmed = String(value).trim()
  if (!trimmed) {
    return null
  }
  if (trimmed.length > MAX_URL_LENGTH) {
    throw new Error(fieldError)
  }
  const normalized = normalizeSupabasePublicObjectUrl(
    trimmed,
    CMS_PUBLIC_MEDIA_PATH,
    '/media/',
  )
  if (!normalized) {
    throw new Error(fieldError)
  }
  return normalized
}

export function parseAvatarUrlForSave(
  value: string | null | undefined,
): string | null {
  if (value === null || value === undefined) {
    return null
  }
  const trimmed = String(value).trim()
  if (!trimmed) {
    return null
  }
  if (trimmed.length > MAX_URL_LENGTH) {
    return null
  }
  return normalizeSupabasePublicObjectUrl(trimmed, AVATARS_PUBLIC_PATH)
}
