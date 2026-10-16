import {
  DEFAULT_PUBLIC_SITE_NAME,
  resolvePublicSiteName,
} from '#/lib/cms/brand-defaults'
import { sanitizeCanonicalUrl } from '#/lib/url-security'

export const SITE_NAME = DEFAULT_PUBLIC_SITE_NAME
export const SITE_DESCRIPTION = ''

export const DEFAULT_SEO_TITLE_TEMPLATE = '{title} · {site}'

export type SeoTitleContext = {
  siteName?: string
  titleTemplate?: string
}

export function seoTitleTemplate(
  title: string,
  context?: SeoTitleContext,
): string {
  const site = resolvePublicSiteName(context?.siteName)
  const template = context?.titleTemplate?.trim() || DEFAULT_SEO_TITLE_TEMPLATE
  return template.replaceAll('{title}', title).replaceAll('{site}', site)
}

export type RootMatch = { routeId: string; loaderData?: unknown }

export function seoContextFromMatches(
  matches: ReadonlyArray<RootMatch>,
): SeoTitleContext | undefined {
  const data = matches.find((match) => match.routeId === '__root__')?.loaderData
  if (
    typeof data === 'object' &&
    data !== null &&
    'seo' in data &&
    typeof data.seo === 'object' &&
    data.seo !== null
  ) {
    const seo = data.seo as Record<string, unknown>
    return {
      siteName:
        typeof seo.siteName === 'string'
          ? resolvePublicSiteName(seo.siteName)
          : undefined,
      titleTemplate:
        typeof seo.titleTemplate === 'string' ? seo.titleTemplate : undefined,
    }
  }
  return undefined
}

export function pageTitle(title: string, context?: SeoTitleContext) {
  return seoTitleTemplate(title, context)
}

const ROBOTS_NOINDEX = 'noindex, nofollow'

export const NOINDEX_HEADERS = {
  'X-Robots-Tag': ROBOTS_NOINDEX,
} as const

export const PUBLIC_CACHE_HEADERS = {
  'Cache-Control':
    'public, max-age=300, s-maxage=300, stale-while-revalidate=600',
} as const

/** Shorter edge TTL so scheduled posts appear without a write-triggered purge. */
export const BLOG_PUBLIC_CACHE_HEADERS = {
  'Cache-Control':
    'public, max-age=60, s-maxage=60, stale-while-revalidate=120',
} as const

export const PUBLIC_XML_CACHE_HEADERS = {
  'Cache-Control':
    'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
} as const

export const PUBLIC_HTML_HEADERS = PUBLIC_CACHE_HEADERS

export function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export function notFoundHead(matches?: ReadonlyArray<RootMatch>) {
  const ctx = matches ? seoContextFromMatches(matches) : undefined
  return {
    meta: [
      { title: pageTitle('Page not found', ctx) },
      { name: 'robots', content: ROBOTS_NOINDEX },
    ],
    links: [],
  }
}

export function noindexHead(title: string, matches?: ReadonlyArray<RootMatch>) {
  const ctx = matches ? seoContextFromMatches(matches) : undefined
  return {
    meta: [
      { title: pageTitle(title, ctx) },
      { name: 'robots', content: ROBOTS_NOINDEX },
    ],
  }
}

export function siteUrlFromMatches(matches: ReadonlyArray<RootMatch>) {
  const data = matches.find((match) => match.routeId === '__root__')?.loaderData
  if (
    typeof data === 'object' &&
    data !== null &&
    'siteUrl' in data &&
    typeof data.siteUrl === 'string'
  ) {
    return data.siteUrl
  }
  return undefined
}

export type PublicHeadInput = {
  title?: string
  pageLabel?: string
  description?: string
  path: string
  siteUrl: string | undefined
  matches?: ReadonlyArray<RootMatch>
  canonicalUrl?: string
  noindex?: boolean
  ogImageUrl?: string
  ogImageAlt?: string
  ogType?: 'website' | 'article'
  articlePublishedTime?: string
  articleModifiedTime?: string
  articleAuthor?: string
  twitterSite?: string
  ogLocale?: string
  rssPath?: string
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}

export function publicHead(input: PublicHeadInput) {
  if (input.noindex) {
    const ctx = input.matches ? seoContextFromMatches(input.matches) : undefined
    const label = input.title ?? input.pageLabel ?? SITE_NAME
    return {
      meta: [
        {
          title: input.title ?? pageTitle(label, ctx),
        },
        { name: 'robots', content: ROBOTS_NOINDEX },
      ],
      links: [],
    }
  }

  const ctx = input.matches ? seoContextFromMatches(input.matches) : undefined
  const resolvedTitle =
    input.title ?? pageTitle(input.pageLabel ?? SITE_NAME, ctx)
  const description = input.description?.trim() || SITE_DESCRIPTION
  const canonical =
    sanitizeCanonicalUrl(input.canonicalUrl) ||
    (input.siteUrl ? new URL(input.path, input.siteUrl).toString() : undefined)
  const twitterCard = input.ogImageUrl ? 'summary_large_image' : 'summary'
  const meta: Array<Record<string, string>> = [
    { title: resolvedTitle },
    { name: 'description', content: description },
    { property: 'og:title', content: resolvedTitle },
    { property: 'og:description', content: description },
    { property: 'og:type', content: input.ogType ?? 'website' },
    { property: 'og:locale', content: input.ogLocale ?? 'en_US' },
    { name: 'twitter:card', content: twitterCard },
    { name: 'twitter:title', content: resolvedTitle },
    { name: 'twitter:description', content: description },
  ]
  if (canonical) {
    meta.push({ property: 'og:url', content: canonical })
  }
  if (input.ogImageUrl) {
    meta.push({ property: 'og:image', content: input.ogImageUrl })
    if (input.ogImageAlt) {
      meta.push({ property: 'og:image:alt', content: input.ogImageAlt })
      meta.push({ name: 'twitter:image:alt', content: input.ogImageAlt })
    }
    meta.push({ name: 'twitter:image', content: input.ogImageUrl })
  }
  if (input.twitterSite) {
    meta.push({ name: 'twitter:site', content: input.twitterSite })
  }
  if (input.articlePublishedTime) {
    meta.push({
      property: 'article:published_time',
      content: input.articlePublishedTime,
    })
  }
  if (input.articleModifiedTime) {
    meta.push({
      property: 'article:modified_time',
      content: input.articleModifiedTime,
    })
  }
  if (input.articleAuthor) {
    meta.push({ property: 'article:author', content: input.articleAuthor })
  }

  const links: Array<{ rel: string; href: string; type?: string }> = []
  if (canonical) {
    links.push({ rel: 'canonical', href: canonical })
  }
  if (input.rssPath && input.siteUrl) {
    links.push({
      rel: 'alternate',
      type: 'application/rss+xml',
      href: new URL(input.rssPath, input.siteUrl).toString(),
    })
  }

  return { meta, links, jsonLd: input.jsonLd }
}
