import type { RootMatch } from '#/lib/seo'

export type RootShellSeo = {
  defaultDescription: string
  socialImageUrl: string | null
  defaultOgImageAlt: string | null
  twitterHandle: string | null
  ogLocale: string
}

export function rootSeoFromMatches(
  matches: ReadonlyArray<RootMatch>,
): RootShellSeo | undefined {
  const data = matches.find((match) => match.routeId === '__root__')?.loaderData
  if (typeof data !== 'object' || data === null || !('seo' in data)) {
    return undefined
  }
  const seo = data.seo
  if (typeof seo !== 'object' || seo === null) {
    return undefined
  }
  const record = seo as Record<string, unknown>
  return {
    defaultDescription:
      typeof record.defaultDescription === 'string'
        ? record.defaultDescription
        : '',
    socialImageUrl:
      typeof record.socialImageUrl === 'string' ? record.socialImageUrl : null,
    defaultOgImageAlt:
      typeof record.defaultOgImageAlt === 'string'
        ? record.defaultOgImageAlt
        : null,
    twitterHandle:
      typeof record.twitterHandle === 'string' ? record.twitterHandle : null,
    ogLocale: typeof record.ogLocale === 'string' ? record.ogLocale : 'en_US',
  }
}
