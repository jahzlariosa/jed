import {
  type PublicHeadInput,
  type RootMatch,
  type SeoTitleContext,
  publicHead,
} from '#/lib/seo'

export type EntrySeoPreviewInput = {
  pageLabel: string
  seoTitle?: string
  metaDescription?: string
  excerpt?: string
  path: string
  siteUrl?: string
  canonicalUrl?: string
  noindex?: boolean
  ogImageUrl?: string
  ogImageAlt?: string
  ogType?: PublicHeadInput['ogType']
  seoContext?: SeoTitleContext
  twitterSite?: string
}

export type EntrySeoPreview = {
  documentTitle: string
  serp: {
    title: string
    url: string
    description: string
    titleMayTruncate: boolean
  }
  social: {
    card: 'summary' | 'summary_large_image'
    title: string
    description: string
    imageUrl?: string
    host: string
  }
  robots?: string
}

function matchesFromSeoContext(ctx: SeoTitleContext): RootMatch[] {
  return [
    {
      routeId: '__root__',
      loaderData: {
        seo: {
          siteName: ctx.siteName,
          titleTemplate: ctx.titleTemplate,
        },
      },
    },
  ]
}

type HeadMetaRow = Record<string, string | undefined>

function metaContent(
  meta: HeadMetaRow[],
  key: string,
  attr: 'name' | 'property' = 'name',
): string | undefined {
  const row = meta.find((entry) => entry[attr] === key)
  return row?.content
}

export function buildEntrySeoPreview(
  input: EntrySeoPreviewInput,
): EntrySeoPreview {
  const matches = input.seoContext
    ? matchesFromSeoContext(input.seoContext)
    : undefined

  const head = publicHead({
    title: input.seoTitle?.trim() || undefined,
    pageLabel: input.pageLabel,
    description:
      input.metaDescription?.trim() || input.excerpt?.trim() || undefined,
    path: input.path,
    siteUrl: input.siteUrl,
    canonicalUrl: input.canonicalUrl?.trim() || undefined,
    noindex: input.noindex,
    ogImageUrl: input.ogImageUrl,
    ogImageAlt: input.ogImageAlt,
    ogType: input.ogType,
    matches,
    twitterSite: input.twitterSite,
  })

  const meta = head.meta
  const titleEntry = meta.find((entry) => 'title' in entry) as
    | { title: string }
    | undefined
  const documentTitle = titleEntry?.title ?? ''
  const serpTitle = metaContent(meta, 'og:title', 'property') ?? documentTitle
  const description =
    metaContent(meta, 'description') ??
    metaContent(meta, 'og:description', 'property') ??
    ''
  const canonical =
    metaContent(meta, 'og:url', 'property') ??
    (input.siteUrl ? new URL(input.path, input.siteUrl).toString() : input.path)
  const cardRaw = metaContent(meta, 'twitter:card') ?? 'summary'
  const card: 'summary' | 'summary_large_image' =
    cardRaw === 'summary_large_image' ? 'summary_large_image' : 'summary'
  const imageUrl =
    metaContent(meta, 'og:image', 'property') ??
    metaContent(meta, 'twitter:image')
  const host = input.siteUrl
    ? new URL(input.siteUrl).host.replace(/^www\./, '')
    : 'yoursite.com'

  return {
    documentTitle,
    serp: {
      title: serpTitle,
      url: canonical,
      description,
      titleMayTruncate: serpTitle.length > 60,
    },
    social: {
      card,
      title: serpTitle,
      description,
      imageUrl,
      host,
    },
    robots: metaContent(meta, 'robots'),
  }
}
