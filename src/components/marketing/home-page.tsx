import { GithubLogo } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'

import { MarketingShowcase } from '#/components/marketing/marketing-showcase'
import {
  MarketingBoxSection,
  MarketingDetailSections,
  MarketingFaqSection,
  MarketingFeatureGrid,
  MarketingStackSection,
} from '#/components/marketing/marketing-sections'
import { MarketingSiteShell } from '#/components/marketing/marketing-site-shell'
import { Reveal } from '#/components/marketing/reveal'
import { StartTerminal } from '#/components/marketing/start-terminal'
import { MAIN_CONTENT_ID } from '#/components/a11y/skip-link'
import type { PublicMarketing } from '#/lib/cms/public-marketing'
import { phosphorIcon } from '#/lib/icon'
import { JED_REPO_URL } from '#/lib/marketing/repo'

const startSteps = [
  {
    num: '01',
    title: 'Clone the repository',
    body: 'Clone JED into a new folder for the client and run npm ci.',
  },
  {
    num: '02',
    title: 'Connect Supabase',
    body: 'Run npm run setup, then link your Supabase project and push the migrations.',
  },
  {
    num: '03',
    title: 'Grant an admin and brand it',
    body: 'Make your account an admin with one SQL insert, then set the name, colour, and logo in settings.',
  },
] as const

export function HomePage({ marketing }: { marketing: PublicMarketing }) {
  return (
    <MarketingSiteShell marketing={marketing} activeNav="home">
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="outline-none">
        <section className="marketing-hero" aria-labelledby="hero-heading">
          <div className="marketing-wrap">
            <Reveal i={0}>
              <Link
                to="/docs/$slug"
                params={{ slug: 'mcp' }}
                className="marketing-pill"
              >
                Now with a REST API and MCP server on scoped tokens
              </Link>
            </Reveal>
            <Reveal i={1}>
              <h1 id="hero-heading">
                The client site starter for TanStack Start and Supabase.
              </h1>
            </Reveal>
            <Reveal i={2}>
              <p className="marketing-hero-sub">
                JED gives you sign-in with two-step login, roles enforced in
                Postgres, an admin your client can run, and an API with an MCP
                server. Start each project from the same tested base and spend
                your time on the parts that are actually new.
              </p>
            </Reveal>
            <Reveal i={3}>
              <div className="marketing-hero-actions">
                <Link
                  to="/docs/$slug"
                  params={{ slug: 'getting-started' }}
                  className="marketing-btn-lg marketing-btn-brand"
                >
                  Read the setup guide
                </Link>
                <Link
                  to="/features"
                  className="marketing-btn-lg marketing-btn-outline-lg"
                >
                  See all features
                </Link>
                <a
                  href={JED_REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View the JED source on GitHub (opens in a new tab)"
                  className="marketing-btn-lg marketing-btn-outline-lg gap-2"
                >
                  <GithubLogo {...phosphorIcon} aria-hidden />
                  View on GitHub
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        <MarketingFeatureGrid
          headingId="features-heading"
          eyebrow="Features"
          title="What you get on day one"
          intro="Each of these works in the demo and is covered in the docs."
        />

        <MarketingShowcase />

        <MarketingDetailSections />

        <MarketingBoxSection />

        <section
          className="marketing-section-block"
          aria-labelledby="audience-heading"
        >
          <div className="marketing-wrap marketing-wrap-wide">
            <div className="marketing-section-head">
              <p className="marketing-eyebrow">Who it's for</p>
              <h2 id="audience-heading">
                Built for developers who ship sites for clients
              </h2>
            </div>
            <div className="marketing-prose">
              <p>
                If you build a new marketing site, blog, or small product site
                every few weeks, you rebuild the same sign-in, admin, and
                content model each time. JED is that layer, already tested.
                Clone it for each client, connect a fresh Supabase project, and
                deploy to Vercel. Each client keeps their own code, database,
                and deployment.
              </p>
              <p>
                It's a good fit if you're comfortable with TypeScript, React,
                and SQL migrations. It's not a hosted CMS or a no-code builder.
              </p>
            </div>
          </div>
        </section>

        <MarketingStackSection />

        <section
          className="marketing-section-block"
          aria-labelledby="start-heading"
        >
          <div className="marketing-wrap marketing-wrap-wide">
            <div className="marketing-section-head">
              <p className="marketing-eyebrow">Getting started</p>
              <h2 id="start-heading">From clone to first admin</h2>
              <p>
                Most setups take a few minutes once your Supabase project
                exists.
              </p>
            </div>
            <div className="marketing-steps items-stretch">
              {startSteps.map((step, index) => (
                <Reveal key={step.num} i={index} className="h-full">
                  <article className="marketing-step flex h-full flex-col">
                    <div className="marketing-step-num">{step.num}</div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
            <StartTerminal />
          </div>
        </section>

        <MarketingFaqSection />

        <section
          className="marketing-section-block"
          aria-labelledby="cta-heading"
        >
          <div className="marketing-wrap marketing-cta">
            <div className="marketing-section-head">
              <h2 id="cta-heading">Start the next client site from JED</h2>
              <p>
                The setup guide takes you from an empty repository to a running
                site with an admin account.
              </p>
            </div>
            <div className="marketing-hero-actions">
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
          </div>
        </section>
      </main>
    </MarketingSiteShell>
  )
}
