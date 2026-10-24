export const DEFAULT_OG_IMAGE_PATH = '/og-default.jpg'

export const DEFAULT_OG_IMAGE_ALT = 'JED TanStack Start Supabase starter'

export function resolveOgImageUrl(input: {
  siteUrl: string | undefined
  ogImageUrl?: string | null
  socialImageUrl?: string | null
}): string | undefined {
  const explicit = input.ogImageUrl?.trim()
  if (explicit) {
    return explicit
  }
  const social = input.socialImageUrl?.trim()
  if (social) {
    return social
  }
  if (input.siteUrl) {
    return new URL(DEFAULT_OG_IMAGE_PATH, input.siteUrl).toString()
  }
  return undefined
}
