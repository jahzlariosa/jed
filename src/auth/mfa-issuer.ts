import { resolvePublicSiteName } from '#/lib/cms/brand-defaults'

const MAX_ISSUER_LENGTH = 64

/**
 * Issuer shown in authenticator apps. A colon would split the otpauth label
 * ("issuer:account"), so it is removed. Falls back to the default site name.
 */
export function totpIssuerFromSiteName(name: string | null | undefined) {
  const cleaned = resolvePublicSiteName(name)
    .replace(/:/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_ISSUER_LENGTH)
    .trim()
  return cleaned || resolvePublicSiteName(null)
}
