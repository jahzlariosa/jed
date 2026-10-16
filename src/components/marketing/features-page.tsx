import {
  Article,
  Code,
  Database,
  EnvelopeSimple,
  Key,
  MagnifyingGlass,
  PlugsConnected,
  ShieldCheck,
  SquaresFour,
} from '@phosphor-icons/react'
import { ClientOnly, Link } from '@tanstack/react-router'
import { createClientOnlyFn } from '@tanstack/react-start'
import type { Icon } from '@phosphor-icons/react'
import { lazy, Suspense } from 'react'

import { FeaturesApiCodeStatic } from '#/components/marketing/features-api-code-static'
import { MarketingSiteShell } from '#/components/marketing/marketing-site-shell'
import { Reveal } from '#/components/marketing/reveal'
import { MAIN_CONTENT_ID } from '#/components/a11y/skip-link'
import type { PublicMarketing } from '#/lib/cms/public-marketing'
import { phosphorIcon } from '#/lib/icon'
import '#/styles/features-page.css'

type FeatureItem = {
  title: string
  description: string
  icon: Icon
}

const getFeaturesApiCodeBlock = createClientOnlyFn(() =>
  lazy(() =>
    import('#/components/marketing/features-api-code-block.client').then(
      (module) => ({
        default: module.FeaturesApiCodeBlock,
      }),
    ),
  ),
)

function FeaturesApiCodeSection() {
  const ApiCodeBlock = getFeaturesApiCodeBlock()
  return (
    <ClientOnly fallback={<FeaturesApiCodeStatic />}>
      <Suspense fallback={<FeaturesApiCodeStatic />}>
        <ApiCodeBlock />
      </Suspense>
    </ClientOnly>
  )
}

const INCLUDED_FEATURES: FeatureItem[] = [
  {
    title: 'Auth with MFA',
    description: 'Sign-in with an optional authenticator step.',
    icon: ShieldCheck,
  },
  {
    title: 'Blog and pages',
    description: 'Write and publish site content from one place.',
    icon: Article,
  },
  {
    title: 'Search',
    description: 'Find posts and pages on the site and in admin.',
    icon: MagnifyingGlass,
  },
  {
    title: 'Contact',
    description: 'A contact form that lands in your inbox tools.',
    icon: EnvelopeSimple,
  },
  {
    title: 'SQL templates',
    description: 'Ready queries for common content tasks.',
    icon: Database,
  },
  {
    title: 'Admin panel',
    description: 'A calm console for content, media, and settings.',
    icon: SquaresFour,
  },
  {
    title: 'Versioned REST',
    description: 'OpenAPI at /api/v1 with personal access tokens.',
    icon: Code,
  },
  {
    title: 'MCP server',
    description: 'Point a client at /api/mcp with the same tokens.',
    icon: PlugsConnected,
  },
  {
    title: 'Access tokens',
    description: 'Create, scope, and revoke tokens from admin.',
    icon: Key,
  },
]

export function FeaturesPage({ marketing }: { marketing: PublicMarketing }) {
  return (
    <MarketingSiteShell marketing={marketing} activeNav="features">
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="outline-none">
        <section className="marketing-page-hero">
          <div className="marketing-wrap">
            <Reveal i={0}>
              <p className="marketing-eyebrow">Features</p>
            </Reveal>
            <Reveal i={1}>
              <h1>Everything you need to ship a client site.</h1>
            </Reveal>
            <Reveal i={2}>
              <p className="marketing-page-lead">
                Auth, content, admin, and a versioned API with MCP in one
                starter you can brand for each client.
              </p>
            </Reveal>
            <Reveal i={3}>
              <div className="marketing-hero-actions mt-7 justify-start">
                <Link
                  to="/signup"
                  className="marketing-btn-lg marketing-btn-brand"
                >
                  Get started
                </Link>
                <Link
                  to="/docs/$slug"
                  params={{ slug: 'getting-started' }}
                  className="marketing-btn-lg marketing-btn-outline-lg"
                >
                  Read the docs
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        <section
          id="included"
          className="marketing-section-block"
          aria-labelledby="features-included-heading"
        >
          <div className="marketing-wrap">
            <div className="marketing-section-head">
              <p className="marketing-eyebrow">Everything included</p>
              <h2 id="features-included-heading">Built in, ready to brand.</h2>
            </div>
            <ul className="marketing-feat-list list-none p-0 m-0">
              {INCLUDED_FEATURES.map((item, index) => (
                <li key={item.title} className="marketing-feat-item">
                  <Reveal i={index % 3}>
                    <div className="marketing-feat-icon" aria-hidden>
                      <item.icon {...phosphorIcon} size={18} />
                    </div>
                    <div className="marketing-feat-name">{item.title}</div>
                    <p className="marketing-feat-desc">{item.description}</p>
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          className="marketing-section-block bg-muted/30"
          aria-labelledby="features-api-heading"
        >
          <div className="marketing-wrap features-api-split">
            <div>
              <Reveal i={0}>
                <div className="flex items-start gap-3">
                  <div className="marketing-feat-icon" aria-hidden>
                    <PlugsConnected {...phosphorIcon} size={18} />
                  </div>
                  <div>
                    <p className="marketing-eyebrow">API and MCP</p>
                    <h2
                      id="features-api-heading"
                      className="text-xl font-semibold tracking-tight"
                    >
                      One token model for REST and tools.
                    </h2>
                  </div>
                </div>
              </Reveal>
              <Reveal i={1}>
                <p className="marketing-page-lead mt-4">
                  Call /api/v1 with OpenAPI, or point an MCP client at /api/mcp.
                  Personal access tokens use the same scopes for REST and tools.
                </p>
              </Reveal>
            </div>
            <Reveal i={1} variant="right">
              <FeaturesApiCodeSection />
            </Reveal>
          </div>
        </section>
      </main>
    </MarketingSiteShell>
  )
}
