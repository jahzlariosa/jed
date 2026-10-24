/** Site-wide meta description when a page omits its own and CMS default is empty. */
export const DEFAULT_SITE_META_DESCRIPTION =
  'TanStack Start Supabase starter for client sites. Two-step login, RLS roles, an admin with a block editor, a blog, REST API and MCP server. Free on GitHub.'

export function resolveMetaDescription(
  pageDescription: string | null | undefined,
  siteDefaultDescription: string | null | undefined,
): string {
  const page = pageDescription?.trim()
  if (page) {
    return page
  }
  const site = siteDefaultDescription?.trim()
  if (site) {
    return site
  }
  return DEFAULT_SITE_META_DESCRIPTION
}

export function assertNonEmptyMetaDescription(description: string): string {
  const trimmed = description.trim()
  if (!trimmed) {
    throw new Error('Meta description must not be empty')
  }
  return trimmed
}
