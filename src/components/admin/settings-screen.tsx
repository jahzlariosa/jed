import {
  Globe,
  MagnifyingGlass,
  Palette,
  PlugsConnected,
  SlidersHorizontal,
} from '@phosphor-icons/react'
import { Link, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useEffect, useMemo, useState } from 'react'

import { AdminFieldLabel } from '#/components/admin/admin-field-label'
import { TimezoneCombobox } from '#/components/admin/timezone-combobox'
import { AdminPageHeader } from '#/components/admin/admin-page-header'
import { AdminSectionBlock } from '#/components/admin/admin-section-block'
import { AdminStickySaveBar } from '#/components/admin/admin-sticky-save-bar'
import { AdminTabPanel, AdminUrlTabs } from '#/components/admin/admin-url-tabs'
import { MFA_POLICIES, type MfaPolicy } from '#/auth'
import { saveSiteSettingsFn } from '#/lib/cms/functions'
import { applyBrandCss } from '#/lib/cms/brand'
import { pathsToText } from '#/lib/cms/site-settings-seo'
import {
  normalizeSiteSettingsForm,
  type SiteSettingsForm,
  siteSettingsFormsEqual,
  toSaveSiteSettingsPayload,
} from '#/lib/cms/site-settings-form'
import { appToast } from '#/lib/app-toast'
import type { SettingsFieldHelpKey } from '#/lib/admin/settings-help'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

const SETTINGS_TABS = [
  { id: 'general', label: 'General', icon: SlidersHorizontal },
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'seo', label: 'SEO', icon: MagnifyingGlass },
  { id: 'integrations', label: 'Integrations', icon: PlugsConnected },
  { id: 'domains', label: 'Domains', icon: Globe },
] as const

export type SettingsTabId = (typeof SETTINGS_TABS)[number]['id']

export function SettingsScreen({
  initial,
  projectRef,
  activeTab,
}: {
  initial: SiteSettingsForm
  projectRef: string
  activeTab: SettingsTabId
}) {
  const router = useRouter()
  const save = useServerFn(saveSiteSettingsFn)
  const [baseline, setBaseline] = useState(() =>
    normalizeSiteSettingsForm(initial),
  )
  const [form, setForm] = useState(() => normalizeSiteSettingsForm(initial))
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const previewStyle = applyBrandCss(form.brand_hex)

  useEffect(() => {
    const next = normalizeSiteSettingsForm(initial)
    setBaseline(next)
    setForm(next)
  }, [initial])

  const dirty = useMemo(
    () => !siteSettingsFormsEqual(form, baseline),
    [form, baseline],
  )

  function setTab(tab: SettingsTabId) {
    void router.navigate({
      to: '/admin/settings',
      search: { tab },
    })
  }

  function discard() {
    setForm(baseline)
    setError('')
  }

  async function onSave() {
    setPending(true)
    setError('')
    const result = await save({ data: toSaveSiteSettingsPayload(form) })
    if (result.error) {
      setError(result.error)
      appToast.error(result.error)
    } else {
      setBaseline(form)
      appToast.success('Settings saved. Your changes are live on the site.')
    }
    setPending(false)
  }

  return (
    <form
      className="admin-page-body grid w-full gap-6"
      onSubmit={(event) => {
        event.preventDefault()
        void onSave()
      }}
    >
      <AdminPageHeader
        title="Settings"
        description="Site identity, branding, SEO, and integrations."
      />

      <AdminUrlTabs
        tabs={SETTINGS_TABS}
        activeTab={activeTab}
        onTabChange={(tab) => setTab(tab as SettingsTabId)}
        ariaLabel="Settings sections"
      />

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <AdminTabPanel id="general" activeTab={activeTab}>
        <AdminSectionBlock
          title="Site identity"
          description="Shown in the admin sidebar, browser title, and public footer."
        >
          <div className="admin-field-grid admin-field-grid-two">
            <Field
              label="Site name"
              helpKey="site_name"
              value={form.site_name}
              onChange={(value) => setForm((f) => ({ ...f, site_name: value }))}
            />
            <Field
              label="Site URL"
              helpKey="site_url"
              value={form.site_url ?? ''}
              onChange={(value) => setForm((f) => ({ ...f, site_url: value }))}
              mono
            />
            <TimezoneCombobox
              label="Timezone"
              helpKey="timezone"
              value={form.timezone}
              onChange={(value) => setForm((f) => ({ ...f, timezone: value }))}
            />
            <Field
              label="Language"
              helpKey="language"
              value={form.language}
              onChange={(value) => setForm((f) => ({ ...f, language: value }))}
            />
            <Field
              label="Contact email"
              helpKey="contact_email"
              value={form.contact_email ?? ''}
              onChange={(value) =>
                setForm((f) => ({ ...f, contact_email: value }))
              }
            />
          </div>
        </AdminSectionBlock>

        <AdminSectionBlock
          title="Multi-factor authentication"
          description="Control authenticator setup and when a code is required to sign in."
        >
          <div className="admin-field-grid">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3">
              <AdminFieldLabel
                label="Allow authenticator setup"
                helpKey="mfa_enabled"
                className="text-sm font-medium"
              />
              <Switch
                checked={form.mfa_enabled}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, mfa_enabled: checked }))
                }
                aria-label="Allow authenticator setup"
              />
            </div>
            <div className="grid gap-1.5">
              <AdminFieldLabel
                label="Sign-in policy"
                helpKey="mfa_policy"
                htmlFor="mfa-policy"
              />
              <select
                id="mfa-policy"
                value={form.mfa_policy}
                disabled={!form.mfa_enabled}
                onChange={(event) =>
                  setForm((f) => ({
                    ...f,
                    mfa_policy: event.target.value as MfaPolicy,
                  }))
                }
                className="admin-input-tall flex w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {MFA_POLICIES.map((policy) => (
                  <option key={policy} value={policy}>
                    {mfaPolicyLabel(policy)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </AdminSectionBlock>

        <AdminSectionBlock
          title="Auth redirects"
          description="Paths on this site after sign-in, sign-up, password reset, and sign-out."
        >
          <div className="admin-field-grid admin-field-grid-two">
            <Field
              label="After sign-in (admin)"
              helpKey="redirect_after_sign_in_admin"
              value={form.redirect_after_sign_in_admin}
              onChange={(value) =>
                setForm((f) => ({ ...f, redirect_after_sign_in_admin: value }))
              }
              mono
            />
            <Field
              label="After sign-in (member)"
              helpKey="redirect_after_sign_in_user"
              value={form.redirect_after_sign_in_user}
              onChange={(value) =>
                setForm((f) => ({ ...f, redirect_after_sign_in_user: value }))
              }
              mono
            />
            <Field
              label="After sign-up"
              helpKey="redirect_after_sign_up"
              value={form.redirect_after_sign_up}
              onChange={(value) =>
                setForm((f) => ({ ...f, redirect_after_sign_up: value }))
              }
              mono
            />
            <Field
              label="After password reset"
              helpKey="redirect_after_password_reset"
              value={form.redirect_after_password_reset}
              onChange={(value) =>
                setForm((f) => ({
                  ...f,
                  redirect_after_password_reset: value,
                }))
              }
              mono
            />
            <Field
              label="After sign-out"
              helpKey="redirect_after_sign_out"
              value={form.redirect_after_sign_out}
              onChange={(value) =>
                setForm((f) => ({ ...f, redirect_after_sign_out: value }))
              }
              mono
            />
          </div>
        </AdminSectionBlock>
      </AdminTabPanel>

      <AdminTabPanel id="branding" activeTab={activeTab}>
        <AdminSectionBlock
          title="Brand color and logo"
          description="Used for buttons, links, and focus outlines."
        >
          <div className="admin-field-grid">
            <div className="brand-preview flex flex-wrap items-end gap-4">
              <div>
                <AdminFieldLabel
                  label="Accent color"
                  helpKey="brand_hex"
                  htmlFor="brand-hex"
                />
                <div className="mt-1 flex items-center gap-2">
                  <input
                    id="brand-hex"
                    type="color"
                    value={form.brand_hex}
                    onChange={(event) =>
                      setForm((f) => ({ ...f, brand_hex: event.target.value }))
                    }
                    className="size-10 cursor-pointer rounded-md border border-input"
                    aria-label="Accent color picker"
                  />
                  <Input
                    value={form.brand_hex}
                    onChange={(event) =>
                      setForm((f) => ({ ...f, brand_hex: event.target.value }))
                    }
                    className="admin-input-tall w-28 font-mono text-xs"
                  />
                </div>
              </div>
              <div className="preview-chip flex gap-2" style={previewStyle}>
                <Button type="button" size="sm">
                  Primary
                </Button>
                <span className="preview-nav admin-nav-link active px-3 py-1.5 text-sm">
                  Nav
                </span>
              </div>
            </div>
            <Field
              label="Logo URL"
              helpKey="logo_url"
              value={form.logo_url ?? ''}
              onChange={(value) => setForm((f) => ({ ...f, logo_url: value }))}
            />
          </div>
        </AdminSectionBlock>
      </AdminTabPanel>

      <AdminTabPanel id="seo" activeTab={activeTab}>
        <AdminSectionBlock
          title="Default meta"
          description="Applied when a page or post does not set its own SEO fields."
        >
          <div className="admin-field-grid">
            <Field
              label="Title template"
              helpKey="seo_title_template"
              value={form.seo_title_template}
              onChange={(value) =>
                setForm((f) => ({ ...f, seo_title_template: value }))
              }
            />
            <div>
              <AdminFieldLabel
                label="Default meta description"
                helpKey="seo_default_description"
                htmlFor="seo-desc"
              />
              <textarea
                id="seo-desc"
                value={form.seo_default_description ?? ''}
                onChange={(event) =>
                  setForm((f) => ({
                    ...f,
                    seo_default_description: event.target.value.slice(0, 160),
                  }))
                }
                className="mt-1 min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                maxLength={160}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {(form.seo_default_description ?? '').length}/160
              </p>
            </div>
            <Field
              label="Default social image URL"
              helpKey="social_image_url"
              value={form.social_image_url ?? ''}
              onChange={(value) =>
                setForm((f) => ({ ...f, social_image_url: value }))
              }
              mono
            />
            <Field
              label="Default social image alt"
              helpKey="default_og_image_alt"
              value={form.default_og_image_alt ?? ''}
              onChange={(value) =>
                setForm((f) => ({ ...f, default_og_image_alt: value }))
              }
            />
            <div className="admin-field-grid admin-field-grid-two">
              <Field
                label="Locale"
                helpKey="og_locale"
                value={form.og_locale}
                onChange={(value) =>
                  setForm((f) => ({ ...f, og_locale: value }))
                }
              />
              <Field
                label="X handle"
                helpKey="twitter_handle"
                value={form.twitter_handle ?? ''}
                onChange={(value) =>
                  setForm((f) => ({ ...f, twitter_handle: value }))
                }
              />
            </div>
          </div>
        </AdminSectionBlock>

        <AdminSectionBlock
          title="Indexing and sitemap"
          description="Preview deployments stay hidden from search engines."
        >
          <div className="admin-field-grid">
            <div className="flex items-center justify-between gap-4">
              <AdminFieldLabel
                label="Allow search indexing"
                helpKey="allow_search_indexing"
                className="text-sm font-medium"
              />
              <Switch
                checked={form.allow_search_indexing}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, allow_search_indexing: checked }))
                }
                aria-label="Allow search indexing"
              />
            </div>
            <div>
              <AdminFieldLabel
                label="Extra robots.txt rules"
                helpKey="robots_extra_rules"
                htmlFor="robots-extra"
              />
              <textarea
                id="robots-extra"
                value={form.robots_extra_rules}
                onChange={(event) =>
                  setForm((f) => ({
                    ...f,
                    robots_extra_rules: event.target.value,
                  }))
                }
                className="mt-1 min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
              />
            </div>
            <div className="grid gap-2">
              <p className="text-sm font-medium">Sitemap</p>
              <div className="flex items-center gap-2 text-sm">
                <Checkbox
                  id="sitemap-include-blog"
                  checked={form.sitemap_include_blog}
                  onCheckedChange={(checked) =>
                    setForm((f) => ({
                      ...f,
                      sitemap_include_blog: checked === true,
                    }))
                  }
                />
                <AdminFieldLabel
                  label="Include blog posts"
                  helpKey="sitemap_include_blog"
                  htmlFor="sitemap-include-blog"
                  className="font-normal"
                />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Checkbox
                  id="sitemap-include-pages"
                  checked={form.sitemap_include_pages}
                  onCheckedChange={(checked) =>
                    setForm((f) => ({
                      ...f,
                      sitemap_include_pages: checked === true,
                    }))
                  }
                />
                <AdminFieldLabel
                  label="Include pages"
                  helpKey="sitemap_include_pages"
                  htmlFor="sitemap-include-pages"
                  className="font-normal"
                />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Checkbox
                  id="sitemap-include-docs"
                  checked={form.sitemap_include_docs}
                  onCheckedChange={(checked) =>
                    setForm((f) => ({
                      ...f,
                      sitemap_include_docs: checked === true,
                    }))
                  }
                />
                <AdminFieldLabel
                  label="Include docs"
                  helpKey="sitemap_include_docs"
                  htmlFor="sitemap-include-docs"
                  className="font-normal"
                />
              </div>
              <div>
                <AdminFieldLabel
                  label="Excluded paths"
                  helpKey="sitemap_excluded_paths"
                  htmlFor="sitemap-excluded"
                />
                <textarea
                  id="sitemap-excluded"
                  value={pathsToText(form.sitemap_excluded_paths)}
                  onChange={(event) =>
                    setForm((f) => ({
                      ...f,
                      sitemap_excluded_paths: event.target.value
                        .split('\n')
                        .map((line) => line.trim())
                        .filter(Boolean),
                    }))
                  }
                  className="mt-1 min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  One path per line.
                </p>
              </div>
              <Link to="/sitemap.xml" className="text-sm underline">
                View sitemap
              </Link>
            </div>
          </div>
        </AdminSectionBlock>

        <AdminSectionBlock
          title="Organization JSON-LD"
          description="Structured data for the site owner or business."
        >
          <div className="admin-field-grid admin-field-grid-two">
            <div>
              <AdminFieldLabel
                label="Organization type"
                helpKey="org_schema_type"
                htmlFor="org-type"
              />
              <select
                id="org-type"
                value={form.org_schema_type}
                onChange={(event) =>
                  setForm((f) => ({
                    ...f,
                    org_schema_type: event.target.value,
                  }))
                }
                className="admin-input-tall mt-1 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="Organization">Organization</option>
                <option value="LocalBusiness">Local business</option>
              </select>
            </div>
            <Field
              label="Legal name"
              helpKey="org_legal_name"
              value={form.org_legal_name ?? ''}
              onChange={(value) =>
                setForm((f) => ({ ...f, org_legal_name: value }))
              }
            />
            <Field
              label="Logo URL"
              helpKey="org_logo_url"
              value={form.org_logo_url ?? ''}
              onChange={(value) =>
                setForm((f) => ({ ...f, org_logo_url: value }))
              }
              mono
            />
            <Field
              label="Phone"
              helpKey="org_phone"
              value={form.org_phone ?? ''}
              onChange={(value) => setForm((f) => ({ ...f, org_phone: value }))}
            />
            <Field
              label="Email"
              helpKey="org_email"
              value={form.org_email ?? ''}
              onChange={(value) => setForm((f) => ({ ...f, org_email: value }))}
            />
            <Field
              label="Opening hours"
              helpKey="org_opening_hours"
              value={form.org_opening_hours ?? ''}
              onChange={(value) =>
                setForm((f) => ({ ...f, org_opening_hours: value }))
              }
            />
            <div className="md:col-span-2">
              <AdminFieldLabel
                label="Address"
                helpKey="org_address"
                htmlFor="org-address"
              />
              <Input
                id="org-address"
                value={form.org_address ?? ''}
                onChange={(event) =>
                  setForm((f) => ({ ...f, org_address: event.target.value }))
                }
                className="admin-input-tall mt-1"
              />
            </div>
            <div className="md:col-span-2">
              <AdminFieldLabel
                label="Social profile URLs"
                helpKey="org_same_as"
                htmlFor="org-same-as"
              />
              <textarea
                id="org-same-as"
                value={pathsToText(form.org_same_as)}
                onChange={(event) =>
                  setForm((f) => ({
                    ...f,
                    org_same_as: event.target.value
                      .split('\n')
                      .map((line) => line.trim())
                      .filter(Boolean),
                  }))
                }
                className="mt-1 min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                One URL per line.
              </p>
            </div>
          </div>
        </AdminSectionBlock>
      </AdminTabPanel>

      <AdminTabPanel id="integrations" activeTab={activeTab}>
        <AdminSectionBlock
          title="Integrations"
          description="Verification codes, analytics, and outbound webhooks."
        >
          <div className="admin-field-grid">
            <Field
              label="Supabase project ref"
              helpKey="supabase_project_ref"
              value={projectRef}
              readOnly
            />
            <Field
              label="Google Search Console code"
              helpKey="google_site_verification"
              value={form.google_site_verification ?? ''}
              onChange={(value) =>
                setForm((f) => ({ ...f, google_site_verification: value }))
              }
            />
            <Field
              label="Bing Webmaster code"
              helpKey="bing_site_verification"
              value={form.bing_site_verification ?? ''}
              onChange={(value) =>
                setForm((f) => ({ ...f, bing_site_verification: value }))
              }
            />
            <Field
              label="Google Analytics 4 ID"
              helpKey="ga4_measurement_id"
              value={form.ga4_measurement_id ?? ''}
              onChange={(value) =>
                setForm((f) => ({ ...f, ga4_measurement_id: value }))
              }
            />
            <Field
              label="Google Tag Manager ID"
              helpKey="gtm_container_id"
              value={form.gtm_container_id ?? ''}
              onChange={(value) =>
                setForm((f) => ({ ...f, gtm_container_id: value }))
              }
            />
            <Field
              label="Plausible domain"
              helpKey="plausible_domain"
              value={form.plausible_domain ?? ''}
              onChange={(value) =>
                setForm((f) => ({ ...f, plausible_domain: value }))
              }
            />
            <Field
              label="Analytics ID (legacy)"
              helpKey="analytics_id"
              value={form.analytics_id ?? ''}
              onChange={(value) =>
                setForm((f) => ({ ...f, analytics_id: value }))
              }
            />
            <div className="flex items-center justify-between gap-4">
              <AdminFieldLabel
                label="Vercel Analytics"
                helpKey="vercel_analytics_enabled"
                className="text-sm font-medium"
              />
              <Switch
                checked={form.vercel_analytics_enabled}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, vercel_analytics_enabled: checked }))
                }
                aria-label="Vercel Analytics"
              />
            </div>
            <Field
              label="Webhook URL"
              helpKey="webhook_url"
              value={form.webhook_url ?? ''}
              onChange={(value) =>
                setForm((f) => ({ ...f, webhook_url: value }))
              }
              mono
            />
          </div>
        </AdminSectionBlock>
      </AdminTabPanel>

      <AdminTabPanel id="domains" activeTab={activeTab}>
        <AdminSectionBlock
          title="External redirect hosts"
          description="HTTPS hosts allowed as targets for URL redirects."
        >
          <div>
            <AdminFieldLabel
              label="Allowed hosts"
              helpKey="redirect_external_hosts"
              htmlFor="redirect-hosts"
            />
            <textarea
              id="redirect-hosts"
              value={pathsToText(form.redirect_external_hosts)}
              onChange={(event) =>
                setForm((f) => ({
                  ...f,
                  redirect_external_hosts: event.target.value
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean),
                }))
              }
              className="mt-1 min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              One host per line, without protocol.
            </p>
          </div>
        </AdminSectionBlock>
        <AdminSectionBlock
          title="Manage redirect rules"
          description="Path rules live on the Redirects page."
        >
          <Button type="button" variant="secondary" size="sm" asChild>
            <Link to="/admin/redirects" search={{ tab: 'rules' }}>
              Open Redirects
            </Link>
          </Button>
        </AdminSectionBlock>
      </AdminTabPanel>

      <AdminStickySaveBar
        dirty={dirty}
        saving={pending}
        onDiscard={discard}
        onSave={() => void onSave()}
      />
    </form>
  )
}

function mfaPolicyLabel(policy: MfaPolicy) {
  switch (policy) {
    case 'off':
      return 'Off'
    case 'optional':
      return 'Optional'
    case 'required_admins':
      return 'Required for admins'
    case 'required_all':
      return 'Required for all signed-in users'
    default:
      return policy
  }
}

function Field({
  label,
  helpKey,
  value,
  onChange,
  readOnly,
  mono,
}: {
  label: string
  helpKey: SettingsFieldHelpKey
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
  mono?: boolean
}) {
  return (
    <div>
      <AdminFieldLabel label={label} helpKey={helpKey} />
      <Input
        value={value}
        readOnly={readOnly}
        onChange={
          onChange ? (event) => onChange(event.target.value) : undefined
        }
        className={`admin-input-tall mt-1${mono ? ' font-mono text-xs' : ''}`}
      />
    </div>
  )
}
