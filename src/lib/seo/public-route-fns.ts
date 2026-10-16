import { createServerFn } from '@tanstack/react-start'

import {
  DEFAULT_PUBLIC_SITE_NAME,
  resolvePublicSiteName,
} from '#/lib/cms/brand-defaults'
import { getPublicMarketingFn } from '#/lib/cms/public-marketing-fns'
import { optimizedCoverImageUrl } from '#/lib/media/cover-image'
import { buildBlogPostingJsonLd, buildHomeJsonLd } from '#/lib/seo/json-ld'
import { loadPublicSeoSettings } from '#/lib/seo/public-settings.server'
import { getSiteUrl } from '#/lib/site.server'

export const getHomeRouteLoaderFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const [marketing, seo, siteUrl] = await Promise.all([
      getPublicMarketingFn(),
      loadPublicSeoSettings(),
      getSiteUrl(),
    ])
    const siteName = resolvePublicSiteName(
      marketing.siteName ?? DEFAULT_PUBLIC_SITE_NAME,
    )
    const jsonLd = siteUrl
      ? JSON.stringify(buildHomeJsonLd({ siteUrl, siteName, settings: seo }))
      : null
    return { marketing, seo, siteUrl, jsonLd }
  },
)

export const buildBlogPostJsonLdFn = createServerFn({ method: 'GET' })
  .validator((input: unknown) => {
    if (typeof input !== 'object' || input === null) {
      throw new Error('Unable to build structured data')
    }
    const raw = input as Record<string, unknown>
    return {
      slug: String(raw.slug ?? ''),
      title: String(raw.title ?? ''),
      excerpt: String(raw.excerpt ?? ''),
      metaDescription:
        typeof raw.metaDescription === 'string' ? raw.metaDescription : null,
      coverImageUrl:
        typeof raw.coverImageUrl === 'string' ? raw.coverImageUrl : null,
      ogImageUrl: typeof raw.ogImageUrl === 'string' ? raw.ogImageUrl : null,
      publishedAt: typeof raw.publishedAt === 'string' ? raw.publishedAt : null,
      updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : null,
      authorName: typeof raw.authorName === 'string' ? raw.authorName : '',
    }
  })
  .handler(async ({ data }) => {
    const [seo, siteUrl] = await Promise.all([
      loadPublicSeoSettings(),
      getSiteUrl(),
    ])
    if (!siteUrl) {
      return { jsonLd: null }
    }
    return {
      jsonLd: JSON.stringify(
        buildBlogPostingJsonLd({
          siteUrl,
          siteName: seo.siteName,
          post: {
            title: data.title,
            slug: data.slug,
            description:
              data.metaDescription ?? data.excerpt ?? seo.defaultDescription,
            imageUrl:
              optimizedCoverImageUrl(data.ogImageUrl ?? data.coverImageUrl) ??
              undefined,
            publishedAt: data.publishedAt,
            modifiedAt: data.updatedAt,
            authorName: data.authorName,
          },
        }),
      ),
    }
  })
