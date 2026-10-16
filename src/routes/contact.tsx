import { EnvelopeSimple } from '@phosphor-icons/react'
import { createFileRoute } from '@tanstack/react-router'

import { ContactForm } from '#/components/contact/contact-form'
import { MarketingSiteShell } from '#/components/marketing/marketing-site-shell'
import { getPublicMarketingFn } from '#/lib/cms/public-marketing-fns'
import { normalizePublicMarketing } from '#/lib/cms/public-marketing'
import { phosphorIcon } from '#/lib/icon'
import { publicHead, PUBLIC_CACHE_HEADERS, siteUrlFromMatches } from '#/lib/seo'

export const Route = createFileRoute('/contact')({
  staleTime: Number.POSITIVE_INFINITY,
  gcTime: Number.POSITIVE_INFINITY,
  headers: () => PUBLIC_CACHE_HEADERS,
  loader: () => getPublicMarketingFn(),
  head: ({ matches }) =>
    publicHead({
      pageLabel: 'Contact',
      description: 'Get in touch about your project.',
      path: '/contact',
      siteUrl: siteUrlFromMatches(matches),
      matches,
    }),
  component: ContactPage,
})

function ContactPage() {
  const marketing = Route.useLoaderData()
  const { contactEmail: raw } = normalizePublicMarketing(marketing)
  const contactEmail = raw?.includes('@') ? raw.trim() : null

  return (
    <MarketingSiteShell marketing={marketing}>
      <main id="main-content" tabIndex={-1} className="outline-none">
        <section className="py-14 md:py-20 lg:py-28">
          <div className="marketing-wrap marketing-wrap-wide grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:sticky lg:top-24 lg:col-span-5">
              <p className="text-sm font-medium text-muted-foreground">
                Contact
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
                Get in touch
              </h1>
              <p className="mt-4 max-w-md text-lg text-muted-foreground">
                Questions about the starter, licensing, or a client build? Send
                us a note.
              </p>
              {contactEmail ? (
                <ul className="mt-10 divide-y divide-border border-y border-border">
                  <li className="flex gap-4 py-5">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40">
                      <EnvelopeSimple
                        {...phosphorIcon}
                        className="size-4 text-muted-foreground"
                      />
                    </span>
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <a
                        href={`mailto:${contactEmail}`}
                        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                      >
                        {contactEmail}
                      </a>
                    </div>
                  </li>
                </ul>
              ) : null}
            </div>
            <div className="lg:col-span-7">
              <ContactForm />
            </div>
          </div>
        </section>
      </main>
    </MarketingSiteShell>
  )
}
