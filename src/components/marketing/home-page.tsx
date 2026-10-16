import {
  Article,
  Code,
  Database,
  EnvelopeSimple,
  GithubLogo,
  Key,
  MagnifyingGlass,
  PlugsConnected,
  ShieldCheck,
  SquaresFour,
} from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import type { Icon } from '@phosphor-icons/react'

import { MarketingShowcase } from '#/components/marketing/marketing-showcase'
import { MarketingSiteShell } from '#/components/marketing/marketing-site-shell'
import { Reveal } from '#/components/marketing/reveal'
import { StartTerminal } from '#/components/marketing/start-terminal'
import { MAIN_CONTENT_ID } from '#/components/a11y/skip-link'
import type { PublicMarketing } from '#/lib/cms/public-marketing'
import { phosphorIcon } from '#/lib/icon'
import { JED_REPO_URL } from '#/lib/marketing/repo'

const homeFeatures: {
  title: string
  description: string
  icon: Icon
}[] = [
  {
    icon: ShieldCheck,
    title: 'Auth with MFA',
    description: 'Sign-in with an optional authenticator step.',
  },
  {
    icon: Article,
    title: 'Blog and pages',
    description: 'Write and publish site content from one place.',
  },
  {
    icon: MagnifyingGlass,
    title: 'Search',
    description: 'Find posts and pages on the site and in admin.',
  },
  {
    icon: EnvelopeSimple,
    title: 'Contact',
    description: 'A contact form that lands in your inbox tools.',
  },
  {
    icon: Database,
    title: 'SQL templates',
    description: 'Ready queries for common content tasks.',
  },
  {
    icon: SquaresFour,
    title: 'Admin panel',
    description: 'A calm console for content, media, and settings.',
  },
  {
    icon: Code,
    title: 'Versioned REST',
    description: 'OpenAPI at /api/v1 with personal access tokens.',
  },
  {
    icon: PlugsConnected,
    title: 'MCP server',
    description: 'Point a client at /api/mcp with the same tokens.',
  },
  {
    icon: Key,
    title: 'Access tokens',
    description: 'Create, scope, and revoke tokens from admin.',
  },
]

const startSteps = [
  {
    num: '01',
    title: 'Clone the starter',
    body: 'Pull the repo and run the local app against your Supabase project.',
  },
  {
    num: '02',
    title: 'Set your brand',
    body: 'Swap --brand, logos, and site name in settings. Keep zinc neutrals.',
  },
  {
    num: '03',
    title: 'Publish content',
    body: 'Write pages and posts in admin, then open the public site.',
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
                New: Admin v2 shell and MCP clients{' '}
                <span className="text-foreground">→</span>
              </Link>
            </Reveal>
            <Reveal i={1}>
              <h1 id="hero-heading">A solid base for the next client site.</h1>
            </Reveal>
            <Reveal i={2}>
              <p className="marketing-hero-sub">
                Auth, admin, and content, ready to brand. Clone it. Ship it.
                Keep the structure.
              </p>
            </Reveal>
            <Reveal i={3}>
              <div className="marketing-hero-actions">
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
                <a
                  href={JED_REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View Jed on GitHub (opens in a new tab)"
                  className="marketing-btn-lg marketing-btn-outline-lg gap-2"
                >
                  <GithubLogo {...phosphorIcon} aria-hidden />
                  View on GitHub
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        <MarketingShowcase />

        <section
          className="marketing-section-block"
          aria-labelledby="features-heading"
        >
          <div className="marketing-wrap">
            <div className="marketing-section-head">
              <p className="marketing-eyebrow">Features</p>
              <h2 id="features-heading">Everything included</h2>
              <p>Real product surface only. Brand it, then ship.</p>
            </div>
            <ul className="marketing-feat-list list-none p-0 m-0">
              {homeFeatures.map((item, index) => (
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
          className="marketing-section-block"
          aria-labelledby="start-heading"
        >
          <div className="marketing-wrap marketing-wrap-wide">
            <div className="marketing-section-head">
              <p className="marketing-eyebrow">Getting started</p>
              <h2 id="start-heading">Three steps to a branded site</h2>
              <p>Clone the starter, set your brand tokens, and publish.</p>
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
      </main>
    </MarketingSiteShell>
  )
}
