import '@tanstack/react-start/server-only'

import {
  isStarterDemoPageSlug,
  isStarterDemoPostSlug,
} from '#/lib/cms/starter-demo-content'
import { listStarterDocs } from '#/lib/starter-docs/catalog'
import { starterDocLastModifiedIso } from '#/lib/starter-docs/lastmod.server'
import { createServiceRoleClient } from '#/lib/supabase/service-role.server'
import { escapeXml } from '#/lib/seo'
import { loadPublicSeoSettings } from '#/lib/seo/public-settings.server'

const PAGE_SIZE = 50

function formatSitemapLastmod(value: string | null | undefined) {
  if (!value) {
    return undefined
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return undefined
  }
  return date.toISOString()
}

function isExcluded(path: string, excluded: string[]) {
  return excluded.some(
    (entry) => entry === path || path.startsWith(`${entry}/`),
  )
}

async function loadSiteSettingsLastmod(): Promise<string | undefined> {
  try {
    const supabase = createServiceRoleClient()
    const { data, error } = await supabase
      .from('site_settings')
      .select('updated_at')
      .eq('id', 1)
      .maybeSingle()
    if (error) {
      console.error(error)
      return undefined
    }
    return formatSitemapLastmod(data?.updated_at)
  } catch (error) {
    console.error(error)
    return undefined
  }
}

async function listAllPublishedPosts() {
  const supabase = createServiceRoleClient()
  const posts: Array<{
    slug: string
    published_at: string | null
    updated_at: string
  }> = []
  let from = 0
  for (;;) {
    const { data, error } = await supabase
      .from('posts')
      .select(
        'slug, published_at, updated_at, noindex, sitemap_exclude, status',
      )
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)
    if (error) {
      console.error(error)
      break
    }
    if (!data?.length) {
      break
    }
    for (const row of data) {
      if (
        row.noindex ||
        row.sitemap_exclude ||
        isStarterDemoPostSlug(row.slug)
      ) {
        continue
      }
      posts.push({
        slug: row.slug,
        published_at: row.published_at,
        updated_at: row.updated_at,
      })
    }
    if (data.length < PAGE_SIZE) {
      break
    }
    from += PAGE_SIZE
  }
  return posts
}

async function listAllPublishedPages() {
  const supabase = createServiceRoleClient()
  const pages: Array<{
    slug: string
    updated_at: string
    published_at: string | null
  }> = []
  let from = 0
  for (;;) {
    const { data, error } = await supabase
      .from('content_entries')
      .select(
        'slug, updated_at, published_at, noindex, sitemap_exclude, status, kind',
      )
      .eq('status', 'published')
      .eq('kind', 'page')
      .order('updated_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)
    if (error) {
      console.error(error)
      break
    }
    if (!data?.length) {
      break
    }
    for (const row of data) {
      if (
        row.noindex ||
        row.sitemap_exclude ||
        isStarterDemoPageSlug(row.slug)
      ) {
        continue
      }
      pages.push({
        slug: row.slug,
        updated_at: row.updated_at,
        published_at: row.published_at,
      })
    }
    if (data.length < PAGE_SIZE) {
      break
    }
    from += PAGE_SIZE
  }
  return pages
}

export async function buildSitemapXml(origin: string): Promise<string> {
  const settings = await loadPublicSeoSettings()
  const excluded = settings.sitemapExcludedPaths
  const siteLastmod = await loadSiteSettingsLastmod()

  const staticPages = [
    { path: '/', priority: '1.0', lastmod: siteLastmod },
    { path: '/features', priority: '0.8', lastmod: siteLastmod },
    {
      path: '/features/api-and-mcp',
      priority: '0.7',
      lastmod: siteLastmod,
    },
    { path: '/blog', priority: '0.8', lastmod: siteLastmod },
    { path: '/contact', priority: '0.6', lastmod: siteLastmod },
  ].filter((page) => !isExcluded(page.path, excluded))

  const docUrls = settings.sitemapIncludeDocs
    ? listStarterDocs()
        .map((doc) => ({
          loc: `${origin}${doc.path}`,
          priority: doc.fileSlug === 'index' ? '0.8' : '0.7',
          lastmod:
            starterDocLastModifiedIso(doc.fileSlug) ?? siteLastmod ?? undefined,
        }))
        .filter((entry) => !isExcluded(entry.loc.replace(origin, ''), excluded))
    : []

  const [posts, cmsPages] = await Promise.all([
    settings.sitemapIncludeBlog ? listAllPublishedPosts() : Promise.resolve([]),
    settings.sitemapIncludePages
      ? listAllPublishedPages()
      : Promise.resolve([]),
  ])

  const urls = [
    ...staticPages.map((page) => ({
      loc: `${origin}${page.path === '/' ? '' : page.path}`,
      priority: page.priority,
      lastmod: page.lastmod,
    })),
    ...docUrls,
    ...cmsPages.map((page) => ({
      loc: `${origin}/${page.slug}`,
      lastmod: formatSitemapLastmod(page.updated_at ?? page.published_at),
      priority: '0.7',
    })),
    ...posts.map((post) => ({
      loc: `${origin}/blog/${post.slug}`,
      lastmod: formatSitemapLastmod(post.updated_at ?? post.published_at),
      priority: '0.6',
    })),
  ]

  const entries = urls
    .map((entry) => {
      const loc = escapeXml(entry.loc)
      const lastmod =
        'lastmod' in entry && entry.lastmod
          ? `\n    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`
          : ''
      return `  <url>\n    <loc>${loc}</loc>${lastmod}\n    <priority>${entry.priority}</priority>\n  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`
}
