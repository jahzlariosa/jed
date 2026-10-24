export type MarketingRouteSeo = {
  title: string
  description: string
}

export const MARKETING_ROUTE_SEO: Record<
  '/' | '/features' | '/blog' | '/docs',
  MarketingRouteSeo
> = {
  '/': {
    title: 'JED: TanStack Start Supabase Starter with Auth and Admin',
    description:
      'TanStack Start Supabase starter for client sites. Two-step login, RLS roles, an admin with a block editor, a blog, REST API and MCP server. Free on GitHub.',
  },
  '/features': {
    title: 'JED Features: TanStack Start Boilerplate with Supabase RLS',
    description:
      'What ships in JED: two-step login, RLS roles, admin and block editor, blog, contact inbox, REST API, MCP server and CI on TanStack Start and Supabase.',
  },
  '/blog': {
    title: 'JED Blog: Guides for the TanStack Start Supabase Starter',
    description:
      'Guides and updates for JED, the TanStack Start Supabase starter. Setup notes, RLS patterns and how to build client sites on the boilerplate.',
  },
  '/docs': {
    title: 'JED Docs: Set Up the TanStack Start Boilerplate on Supabase',
    description:
      'Set up, configure and deploy JED, the TanStack Start boilerplate with Supabase. Covers auth, RLS roles, the admin panel, REST API and MCP tokens.',
  },
}
