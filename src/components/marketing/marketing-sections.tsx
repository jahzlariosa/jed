import {
  ArrowRight,
  Check,
  Code,
  Database,
  EnvelopeSimple,
  GitBranch,
  Images,
  Key,
  LockKey,
  MagnifyingGlass,
  Palette,
  PlugsConnected,
  Rss,
  ShieldCheck,
  SquaresFour,
  UsersThree,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'

import { Reveal } from '#/components/marketing/reveal'
import { phosphorIcon } from '#/lib/icon'

type FeatureItem = {
  title: string
  description: string
  icon: Icon
}

export const MARKETING_FEATURES: FeatureItem[] = [
  {
    icon: ShieldCheck,
    title: 'Sign-in and two-step login',
    description:
      'Email and Google sign-in, plus TOTP codes you can require for admins or for everyone.',
  },
  {
    icon: UsersThree,
    title: 'Roles enforced by RLS',
    description:
      "Permissions live in Postgres, so the database refuses what the app shouldn't allow.",
  },
  {
    icon: SquaresFour,
    title: 'Admin panel and editor',
    description:
      'Pages and posts in a BlockNote editor with drafts, so clients can update the site without you.',
  },
  {
    icon: Rss,
    title: 'Blog with RSS',
    description:
      'Public post list, post pages, and an RSS feed, all listed in the sitemap.',
  },
  {
    icon: Images,
    title: 'Media library',
    description:
      'Upload and reuse images from the admin, with signed upload tickets on the server.',
  },
  {
    icon: MagnifyingGlass,
    title: 'Search',
    description:
      'Postgres full-text search for pages and posts, and Ctrl K to jump through the docs.',
  },
  {
    icon: EnvelopeSimple,
    title: 'Contact inbox',
    description:
      'Messages are stored in an admin inbox, with optional email delivery through Resend.',
  },
  {
    icon: Palette,
    title: 'Branding settings',
    description:
      'Site name, accent colour, logo, and navbar and footer width, changed from settings.',
  },
  {
    icon: Database,
    title: 'SQL templates',
    description:
      'Every migration with a plain-English summary and an applied or not-applied badge.',
  },
  {
    icon: Code,
    title: 'REST API with OpenAPI',
    description:
      'Read and write endpoints under /api/v1, described in an OpenAPI spec you can generate clients from.',
  },
  {
    icon: PlugsConnected,
    title: 'MCP server',
    description:
      'Connect an AI client to /api/mcp. Writes need confirm: true and an idempotency key.',
  },
  {
    icon: Key,
    title: 'Tokens and audit log',
    description:
      'Scoped tokens run as their owner under RLS, and every call is written to the audit log.',
  },
  {
    icon: LockKey,
    title: 'Security headers',
    description:
      'CSP and CSRF protection are on by default, and session pages are never cached publicly.',
  },
  {
    icon: GitBranch,
    title: 'CI and tests',
    description:
      'Every pull request runs Biome, typecheck, tests, a build, and npm audit.',
  },
]

const DETAIL_SECTIONS = [
  {
    id: 'auth',
    eyebrow: 'Auth and roles',
    title: 'Access control that holds up when someone skips the UI',
    body: "Sign-in runs on Supabase Auth with cookie sessions checked on the server. New accounts start as members. Admin access comes from a roles table, and row level security checks the same permissions on every query, so a bug in a page can't hand out data the database wouldn't. Turn on TOTP two-step login with one of four policies: off, optional, required for admins, or required for everyone.",
    linkLabel: 'How auth and roles work',
    slug: 'auth-and-mfa',
  },
  {
    id: 'admin',
    eyebrow: 'Admin',
    title: 'An admin your client can use without calling you',
    body: 'Pages and blog posts are written in a BlockNote editor with drafts and previews. Next to them sit the media library, users, redirects, the contact inbox, the audit log, and settings for branding and layout. Each screen checks its own permission, so you can hand out access screen by screen.',
    linkLabel: 'Tour the admin panel',
    slug: 'admin-panel',
  },
  {
    id: 'api',
    eyebrow: 'API and MCP',
    title: 'One token model for scripts and AI clients',
    body: "The REST API under /api/v1 and the MCP server at /api/mcp run the same handlers. A personal access token carries the scopes you pick, never more than its owner has, and each call runs as that person under RLS. Every call lands in the audit log. MCP writes need confirm: true and an idempotency key, so a retried call can't apply a change twice.",
    linkLabel: 'Read the API docs',
    slug: 'api',
  },
  {
    id: 'shipping',
    eyebrow: 'Shipping',
    title: 'Checks on every pull request',
    body: 'CI runs Biome, the TypeScript check, the Vitest suite, a production build, and npm audit on every pull request. CSP headers, CSRF protection on server functions, and private cache headers on session routes are set before you write a line.',
    linkLabel: 'Deploying to Vercel',
    slug: 'deploy',
  },
] as const

const STACK = [
  {
    name: 'TanStack Start',
    line: 'React 19 and Vite, with file routes, loaders, and server functions',
  },
  { name: 'Supabase', line: 'Postgres, Auth, Storage, and row level security' },
  {
    name: 'Vercel',
    line: 'Deploys through the Nitro Vercel preset, with a preview for every pull request',
  },
  {
    name: 'Tailwind and shadcn/ui',
    line: 'Design tokens and accessible components you can restyle per client',
  },
  { name: 'Zod', line: 'Validation at every server boundary and for the API' },
  { name: 'Biome and Vitest', line: 'Lint, format, and tests, run in CI' },
] as const

export function MarketingFeatureGrid({
  headingId,
  eyebrow,
  title,
  intro,
}: {
  headingId: string
  eyebrow: string
  title: string
  intro?: string
}) {
  return (
    <section className="marketing-section-block" aria-labelledby={headingId}>
      <div className="marketing-wrap marketing-wrap-wide">
        <div className="marketing-section-head">
          <p className="marketing-eyebrow">{eyebrow}</p>
          <h2 id={headingId}>{title}</h2>
          {intro ? <p>{intro}</p> : null}
        </div>
        <ul className="marketing-feat-list marketing-feat-list-pairs m-0 list-none p-0">
          {MARKETING_FEATURES.map((item, index) => (
            <li key={item.title} className="marketing-feat-item">
              <Reveal i={index % 2}>
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
  )
}

export function MarketingDetailSections() {
  return (
    <section
      className="marketing-section-block"
      aria-label="How the main parts work"
    >
      <div className="marketing-wrap marketing-wrap-wide">
        <div className="marketing-detail-grid">
          {DETAIL_SECTIONS.map((section, index) => (
            <Reveal key={section.id} i={index % 2} className="h-full">
              <article
                className="marketing-step marketing-detail flex h-full flex-col"
                aria-labelledby={`detail-${section.id}`}
              >
                <p className="marketing-eyebrow">{section.eyebrow}</p>
                <h2 id={`detail-${section.id}`}>{section.title}</h2>
                <p>{section.body}</p>
                <Link
                  to="/docs/$slug"
                  params={{ slug: section.slug }}
                  className="marketing-detail-link"
                >
                  {section.linkLabel}
                  <ArrowRight {...phosphorIcon} size={14} aria-hidden />
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export function MarketingStackSection() {
  return (
    <section
      className="marketing-section-block"
      aria-labelledby="stack-heading"
    >
      <div className="marketing-wrap marketing-wrap-wide">
        <div className="marketing-section-head">
          <p className="marketing-eyebrow">Stack</p>
          <h2 id="stack-heading">Tools you already know</h2>
        </div>
        <ul className="marketing-steps m-0 list-none p-0">
          {STACK.map((item) => (
            <li key={item.name} className="marketing-step">
              <h3>{item.name}</h3>
              <p>{item.line}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

const BOX_ITEMS = [
  'TanStack Start app with React 19, file routes, and server functions',
  'Supabase migrations for profiles, roles, content, media, contact messages, and API tokens, all with RLS',
  'Sign-in, sign-up, password reset, Google sign-in, and TOTP enrolment and challenge pages',
  'Admin: dashboard, pages, blog, media, users, redirects, contact inbox, audit log, SQL templates, settings, and API tokens',
  'Public pages: home, features, docs, blog with RSS, search, contact, and sitemap.xml',
  'REST API under /api/v1 with an OpenAPI spec, and an MCP server at /api/mcp',
  'Vercel deployment through the Nitro preset',
  'GitHub Actions CI and a Vitest suite',
  '.env.example with every variable explained',
] as const

export function MarketingBoxSection() {
  return (
    <section className="marketing-section-block" aria-labelledby="box-heading">
      <div className="marketing-wrap marketing-wrap-wide">
        <div className="marketing-section-head">
          <p className="marketing-eyebrow">In the box</p>
          <h2 id="box-heading">What's in the repository</h2>
        </div>
        <ul className="marketing-box-list m-0 list-none p-0">
          {BOX_ITEMS.map((item) => (
            <li key={item}>
              <Check {...phosphorIcon} size={16} aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

const FAQ = [
  {
    q: 'Is JED a hosted CMS?',
    a: "No. It's a code starter. You clone it for each client and host it on your own Vercel and Supabase accounts.",
  },
  {
    q: 'Do I have to use Vercel?',
    a: 'The build is set up for Vercel with the Nitro Vercel preset, and the docs cover that path. Other hosts would need a different Nitro preset.',
  },
  {
    q: 'How do I bring starter updates into an existing client site?',
    a: 'Add the starter as a git remote, fetch it, and merge or cherry-pick what you need. Then apply any new migrations with npx supabase db push.',
  },
  {
    q: 'Can an AI assistant break the site through MCP?',
    a: "A token can't do more than its owner, every query runs under RLS, and write tools only run with confirm: true and an idempotency key. Every call is in the audit log, and you can revoke a token at any time.",
  },
  {
    q: 'Does the contact form need an email service?',
    a: 'No. Messages are saved to the admin inbox. Add a Resend API key and sender address if you also want them emailed.',
  },
  {
    q: "Can I drop features I don't need?",
    a: "Yes. It's your code. Remove the routes and admin screens you don't use, and keep the migrations in order.",
  },
] as const

export function MarketingFaqSection() {
  return (
    <section className="marketing-section-block" aria-labelledby="faq-heading">
      <div className="marketing-wrap marketing-wrap-wide">
        <div className="marketing-section-head">
          <h2 id="faq-heading">Questions</h2>
        </div>
        <dl className="marketing-faq">
          {FAQ.map((item) => (
            <div key={item.q} className="marketing-step">
              <dt>{item.q}</dt>
              <dd>{item.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
