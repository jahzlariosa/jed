import type { PublicSeoSettings } from '#/lib/seo/public-settings.server'

export const JED_CODE_REPOSITORY = 'https://github.com/jahzlariosa/jed'

export function serializeJsonLd(
  data: Record<string, unknown> | Record<string, unknown>[],
): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

export function buildHomeJsonLd(input: {
  siteUrl: string
  siteName: string
  settings: PublicSeoSettings
}) {
  const { siteUrl, siteName, settings } = input
  const orgName = settings.orgLegalName?.trim() || siteName
  const graph: Record<string, unknown>[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteName,
      url: siteUrl,
    },
  ]
  const org: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': settings.orgSchemaType,
    name: orgName,
    url: siteUrl,
  }
  if (settings.orgLogoUrl) {
    org.logo = settings.orgLogoUrl
  }
  if (settings.orgAddress) {
    org.address = settings.orgAddress
  }
  if (settings.orgPhone) {
    org.telephone = settings.orgPhone
  }
  if (settings.orgEmail) {
    org.email = settings.orgEmail
  }
  if (settings.orgOpeningHours && settings.orgSchemaType === 'LocalBusiness') {
    org.openingHours = settings.orgOpeningHours
  }
  if (settings.orgSameAs.length > 0) {
    org.sameAs = settings.orgSameAs
  }
  graph.push(org)
  graph.push({
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: siteName,
    description: settings.defaultDescription.trim() || undefined,
    url: siteUrl,
    codeRepository: JED_CODE_REPOSITORY,
    programmingLanguage: 'TypeScript',
    runtimePlatform: 'Node.js',
  })
  return graph
}

export function buildDocsTechArticleJsonLd(input: {
  siteUrl: string
  siteName: string
  doc: {
    title: string
    description: string
    path: string
  }
}) {
  const url = new URL(input.doc.path, input.siteUrl).toString()
  const article: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: input.doc.title,
    description: input.doc.description,
    url,
    mainEntityOfPage: url,
    publisher: {
      '@type': 'Organization',
      name: input.siteName,
    },
  }
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: input.siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Docs',
        item: new URL('/docs', input.siteUrl).toString(),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: input.doc.title,
        item: url,
      },
    ],
  }
  return [article, breadcrumbs]
}

export function buildBlogPostingJsonLd(input: {
  siteUrl: string
  siteName: string
  post: {
    title: string
    slug: string
    description: string
    imageUrl?: string
    publishedAt?: string | null
    modifiedAt?: string | null
    authorName?: string
  }
}) {
  const url = new URL(`/blog/${input.post.slug}`, input.siteUrl).toString()
  const article: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: input.post.title,
    description: input.post.description,
    mainEntityOfPage: url,
    url,
    publisher: {
      '@type': 'Organization',
      name: input.siteName,
    },
  }
  if (input.post.imageUrl) {
    article.image = input.post.imageUrl
  }
  if (input.post.publishedAt) {
    article.datePublished = input.post.publishedAt
  }
  if (input.post.modifiedAt) {
    article.dateModified = input.post.modifiedAt
  }
  if (input.post.authorName) {
    article.author = {
      '@type': 'Person',
      name: input.post.authorName,
    }
  }
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: input.siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: new URL('/blog', input.siteUrl).toString(),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: input.post.title,
        item: url,
      },
    ],
  }
  return [article, breadcrumbs]
}
