import { getRouteApi } from '@tanstack/react-router'
import { useMemo } from 'react'

import { AdminSectionBlock } from '#/components/admin/admin-section-block'
import { buildEntrySeoPreview } from '#/lib/seo/entry-meta-preview'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

export type SeoEntryForm = {
  seoTitle: string
  metaDescription: string
  canonicalUrl: string
  ogImageAlt: string
  noindex: boolean
  sitemapExclude: boolean
}

const rootRoute = getRouteApi('__root__')

export function SeoEntryFields({
  value,
  onChange,
  pageLabel,
  path,
  excerpt,
  ogImageUrl,
  ogType = 'website',
}: {
  value: SeoEntryForm
  onChange: (next: SeoEntryForm) => void
  pageLabel: string
  path: string
  excerpt?: string
  ogImageUrl?: string | null
  ogType?: 'website' | 'article'
}) {
  const shell = rootRoute.useLoaderData()
  const descLen = value.metaDescription.length

  const preview = useMemo(
    () =>
      buildEntrySeoPreview({
        pageLabel,
        seoTitle: value.seoTitle,
        metaDescription: value.metaDescription,
        excerpt,
        path,
        siteUrl: shell.siteUrl,
        canonicalUrl: value.canonicalUrl,
        noindex: value.noindex,
        ogImageUrl: ogImageUrl ?? shell.seo.socialImageUrl ?? undefined,
        ogImageAlt: value.ogImageAlt,
        ogType,
        seoContext: {
          siteName: shell.seo.siteName,
          titleTemplate: shell.seo.titleTemplate,
        },
        twitterSite: shell.seo.twitterHandle ?? undefined,
      }),
    [
      excerpt,
      ogImageUrl,
      ogType,
      pageLabel,
      path,
      shell.seo.siteName,
      shell.seo.socialImageUrl,
      shell.seo.titleTemplate,
      shell.seo.twitterHandle,
      shell.siteUrl,
      value,
    ],
  )

  return (
    <>
      <AdminSectionBlock
        title="Search listing"
        description="Overrides the site default meta for this entry."
      >
        <div className="admin-field-grid">
          <div>
            <Label htmlFor="seo-title">SEO title</Label>
            <Input
              id="seo-title"
              value={value.seoTitle}
              onChange={(event) =>
                onChange({ ...value, seoTitle: event.target.value })
              }
              className="admin-input-tall mt-1"
              maxLength={200}
            />
          </div>
          <div>
            <Label htmlFor="seo-meta">Meta description</Label>
            <textarea
              id="seo-meta"
              value={value.metaDescription}
              onChange={(event) =>
                onChange({ ...value, metaDescription: event.target.value })
              }
              className="mt-1 min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              maxLength={320}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {descLen}/160 characters
              {descLen > 160 ? ' (long for search snippets)' : ''}
            </p>
          </div>
          <div>
            <Label htmlFor="seo-canonical">Canonical URL</Label>
            <Input
              id="seo-canonical"
              value={value.canonicalUrl}
              onChange={(event) =>
                onChange({ ...value, canonicalUrl: event.target.value })
              }
              className="admin-input-tall mt-1 font-mono text-xs"
              placeholder="Optional"
            />
          </div>
          <div>
            <Label htmlFor="seo-og-alt">Social image alt</Label>
            <Input
              id="seo-og-alt"
              value={value.ogImageAlt}
              onChange={(event) =>
                onChange({ ...value, ogImageAlt: event.target.value })
              }
              className="admin-input-tall mt-1"
              maxLength={200}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Hide from search engines</p>
              <p className="text-xs text-muted-foreground">Adds noindex.</p>
            </div>
            <Switch
              checked={value.noindex}
              onCheckedChange={(checked) =>
                onChange({ ...value, noindex: checked === true })
              }
              aria-label="Hide from search engines"
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Exclude from sitemap</p>
            </div>
            <Switch
              checked={value.sitemapExclude}
              onCheckedChange={(checked) =>
                onChange({ ...value, sitemapExclude: checked === true })
              }
              aria-label="Exclude from sitemap"
            />
          </div>
        </div>
      </AdminSectionBlock>
      <AdminSectionBlock title="Search preview">
        <div className="admin-serp-preview">
          <p className="admin-serp-title">{preview.serp.title}</p>
          <p className="admin-serp-url">{preview.serp.url}</p>
          <p className="admin-serp-desc">{preview.serp.description}</p>
          {preview.serp.titleMayTruncate ? (
            <p className="mt-2 text-xs text-amber-700">
              Title may be truncated in results.
            </p>
          ) : null}
          {preview.robots ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Robots: {preview.robots}
            </p>
          ) : null}
        </div>
      </AdminSectionBlock>
      <AdminSectionBlock title="Social preview">
        <div className="admin-social-card">
          {preview.social.imageUrl &&
          preview.social.card === 'summary_large_image' ? (
            <img
              src={preview.social.imageUrl}
              alt=""
              className="admin-social-card-img"
            />
          ) : (
            <div className="admin-social-card-img admin-social-card-img-placeholder" />
          )}
          <div className="admin-social-card-body">
            <p className="admin-social-card-host">{preview.social.host}</p>
            <p className="admin-social-card-title">{preview.social.title}</p>
            <p className="admin-social-card-desc">
              {preview.social.description}
            </p>
          </div>
        </div>
      </AdminSectionBlock>
    </>
  )
}
