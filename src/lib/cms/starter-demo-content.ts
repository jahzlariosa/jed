/** Starter demo CMS rows that must stay out of the sitemap and carry noindex. */
export const STARTER_DEMO_PAGE_SLUGS = new Set(['test-page'])

export const STARTER_DEMO_POST_SLUGS = new Set(['test-blog-post'])

export function isStarterDemoPageSlug(slug: string): boolean {
  return STARTER_DEMO_PAGE_SLUGS.has(slug)
}

export function isStarterDemoPostSlug(slug: string): boolean {
  return STARTER_DEMO_POST_SLUGS.has(slug)
}
