import { PlugsConnected } from '@phosphor-icons/react'
import { ClientOnly, Link } from '@tanstack/react-router'
import { createClientOnlyFn } from '@tanstack/react-start'
import { lazy, Suspense } from 'react'

import { FeaturesApiCodeStatic } from '#/components/marketing/features-api-code-static'
import {
  MarketingDetailSections,
  MarketingFeatureGrid,
  MarketingStackSection,
} from '#/components/marketing/marketing-sections'
import { MarketingSiteShell } from '#/components/marketing/marketing-site-shell'
import { Reveal } from '#/components/marketing/reveal'
import { MAIN_CONTENT_ID } from '#/components/a11y/skip-link'
import type { PublicMarketing } from '#/lib/cms/public-marketing'
import { phosphorIcon } from '#/lib/icon'
import '#/styles/features-page.css'

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
              <h1>Every feature in JED</h1>
            </Reveal>
            <Reveal i={2}>
              <p className="marketing-page-lead">
                What ships in the starter, what each part does for you, and
                where to read more.
              </p>
            </Reveal>
            <Reveal i={3}>
              <div className="marketing-hero-actions mt-7 justify-start">
                <Link
                  to="/docs/$slug"
                  params={{ slug: 'getting-started' }}
                  className="marketing-btn-lg marketing-btn-brand"
                >
                  Read the setup guide
                </Link>
                <Link
                  to="/docs"
                  className="marketing-btn-lg marketing-btn-outline-lg"
                >
                  Browse the docs
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        <MarketingFeatureGrid
          headingId="features-included-heading"
          eyebrow="At a glance"
          title="Fourteen features, all in the demo"
        />

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
                      The same tokens for REST and MCP
                    </h2>
                  </div>
                </div>
              </Reveal>
              <Reveal i={1}>
                <p className="marketing-page-lead mt-4">
                  Call /api/v1 from scripts and generate clients from the
                  OpenAPI spec, or connect an AI client to /api/mcp. Both take
                  the same personal access tokens, check the same scopes, and
                  run each call as the token owner under RLS.
                </p>
              </Reveal>
            </div>
            <Reveal i={1} variant="right">
              <FeaturesApiCodeSection />
            </Reveal>
          </div>
        </section>

        <MarketingDetailSections />

        <MarketingStackSection />
      </main>
    </MarketingSiteShell>
  )
}
