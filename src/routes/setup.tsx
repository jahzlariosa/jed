import { createFileRoute, Link, notFound } from '@tanstack/react-router'

import { AuthAlert } from '#/components/auth/auth-alert'
import { MarketingAuthLayout } from '#/components/marketing/marketing-auth-layout'
import {
  DEFAULT_BRAND_HEX,
  DEFAULT_PUBLIC_SITE_NAME,
} from '#/lib/cms/brand-defaults'
import { normalizePublicMarketing } from '#/lib/cms/public-marketing'
import { getAuthBrandingFn } from '#/lib/cms/public-marketing-fns'
import { SETUP_CACHE_HEADERS } from '#/lib/env/gate'
import { getSetupStatusFn } from '#/lib/env/setup-status'
import { noindexHead, notFoundHead } from '#/lib/seo'

const pendingMarketing = normalizePublicMarketing({
  siteName: DEFAULT_PUBLIC_SITE_NAME,
  contactEmail: null,
  brandHex: DEFAULT_BRAND_HEX,
})

export const Route = createFileRoute('/setup')({
  staleTime: 0,
  gcTime: 0,
  preload: false,
  headers: () => SETUP_CACHE_HEADERS,
  head: ({ matches }) =>
    import.meta.env.DEV
      ? noindexHead('Connect Supabase', matches)
      : notFoundHead(matches),
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw notFound()
    }
  },
  loader: () => getSetupPageData(),
  pendingComponent: SetupPending,
  component: SetupPage,
})

async function getSetupPageData() {
  const [status, marketing] = await Promise.all([
    getSetupStatusFn(),
    getAuthBrandingFn(),
  ])
  return { status, marketing }
}

function SetupPending() {
  return (
    <MarketingAuthLayout
      marketing={pendingMarketing}
      icon="gear"
      title="Connect Supabase"
      description="Checking the Supabase project for this site."
    >
      <p className="text-sm text-muted-foreground">One moment.</p>
    </MarketingAuthLayout>
  )
}

function SetupPage() {
  const { status, marketing } = Route.useLoaderData()
  const ready = status.ok

  return (
    <MarketingAuthLayout
      marketing={marketing}
      icon="gear"
      title={ready ? 'Supabase is connected' : 'Connect Supabase'}
      description={
        ready
          ? 'This site can reach your Supabase project.'
          : 'JED needs your Supabase project before sign-in, content, and admin can load.'
      }
    >
      {ready ? (
        <AuthAlert tone="success" title="Ready">
          Open the site when you want to continue.
        </AuthAlert>
      ) : (
        <AuthAlert tone="error" title="Finish setup on this computer">
          In the project folder, run <code>npm run setup</code>. Then start the
          app again.
        </AuthAlert>
      )}
      {status.items.length > 0 ? (
        <>
          <h2 className="mt-5 mb-2 text-sm font-medium text-foreground">
            Still needed
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-foreground">
            {status.items.map((item) => (
              <li key={`${item.name}:${item.message}`}>
                <span className="font-medium">{item.name}</span>
                {': '}
                {item.message}
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {ready ? (
        <Link to="/" className="marketing-auth-submit mt-5">
          Continue
        </Link>
      ) : (
        <p className="mt-5 text-sm text-muted-foreground">
          Saved values stay on this computer and are not shown here.
        </p>
      )}
    </MarketingAuthLayout>
  )
}
