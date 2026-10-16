/**
 * Help copy for /admin/settings fields. Review and edit here only.
 */
export const SETTINGS_FIELD_HELP = {
  site_name:
    'The public name of your site. It appears in the admin sidebar, browser titles, marketing footer, and anywhere the site name is shown.',
  site_url:
    'The main web address of your site, starting with https. Used for canonical links, the sitemap, and social previews when a page does not set its own URL.',
  timezone:
    'How dates and scheduled publishing are interpreted on the server. Pick a city-based zone from the list; the label shows the current UTC offset.',
  language:
    'The default language code for public pages, such as en or ja. Search engines and browsers use this as a hint for your content.',
  contact_email:
    'The inbox for messages sent from the public contact form. When empty, visitors still see the form but submissions are not emailed.',
  mfa_enabled:
    'Lets signed-in people add an authenticator app from their account. When off, setup is hidden and sign-in rules below are not enforced.',
  mfa_policy:
    'Who must enter an authenticator code after password sign-in. Enroll your own authenticator before you require codes for admins or everyone.',
  redirect_after_sign_in_admin:
    'Where admins land after a successful sign-in when no other redirect is set. Use a path on this site, such as /admin.',
  redirect_after_sign_in_user:
    'Where members land after sign-in when no other redirect is set. Use a path on this site, such as /.',
  redirect_after_sign_up:
    'Where new members go after they confirm email and sign in. Use a path on this site, such as /.',
  redirect_after_password_reset:
    'Where someone goes after setting a new password from the reset email. Use a path on this site, such as /account.',
  redirect_after_sign_out:
    'Where visitors go after signing out. Use a path on this site, such as /login.',
  brand_hex:
    'The accent color for buttons, links, and focus rings across marketing, auth, and account pages. Use a six-digit hex code, such as #111111.',
  logo_url:
    'Optional image URL for the logo in the admin sidebar and other chrome. Use a full https link to an image you host.',
  seo_title_template:
    'How browser titles are built when a page supplies a title. Use {title} for the page name and {site} for the site name, for example {title} · {site}.',
  seo_default_description:
    'Fallback description for search and social cards when a page or post does not set its own. Keep it under 160 characters in plain language.',
  social_image_url:
    'Default image for link previews on social networks. Use a full https URL to an image in this site media library.',
  default_og_image_alt:
    'Short description of the default social image for screen readers and platforms that support alt text.',
  og_locale:
    'Locale for Open Graph tags, such as en_US or ja_JP. Helps social platforms show the right language for shared links.',
  twitter_handle:
    'Your X (Twitter) username for Twitter Card tags, with or without @. Example: @yourcompany.',
  allow_search_indexing:
    'When off, public pages ask search engines not to index them and robots.txt blocks crawling. Use this on staging or private sites.',
  robots_extra_rules:
    'Additional lines appended to robots.txt after the default rules. One directive per line, such as Disallow: /private.',
  sitemap_include_blog:
    'When on, published blog posts are listed in sitemap.xml so search engines can find them.',
  sitemap_include_pages:
    'When on, published CMS pages are listed in sitemap.xml.',
  sitemap_include_docs:
    'When on, starter documentation pages are listed in sitemap.xml.',
  sitemap_excluded_paths:
    'Paths to leave out of the sitemap even when they are public. One path per line starting with /, such as /draft-preview.',
  org_schema_type:
    'Tells search engines whether to describe your site as a general organization or a local business in structured data.',
  org_legal_name:
    'Official business name used in JSON-LD structured data. Can differ from the public site name.',
  org_logo_url:
    'Logo image for organization structured data. Use a full https URL to an image in this site media library.',
  org_phone:
    'Public phone number for structured data. Use a format visitors would dial, such as +1 555 0100.',
  org_email:
    'Public contact email for structured data. Can match or differ from the contact form address.',
  org_opening_hours:
    'Plain text summary of when you are open, shown in structured data for local businesses.',
  org_address:
    'Mailing or street address for structured data. Use a single line visitors would recognize.',
  org_same_as:
    'Links to official social profiles in structured data. One full https URL per line, such as https://www.linkedin.com/company/example.',
  supabase_project_ref:
    'Your hosted Supabase project reference for support and setup. Shown here for convenience; it is not editable.',
  google_site_verification:
    'Verification token from Google Search Console. Paste only the code value, not the full meta tag.',
  bing_site_verification:
    'Verification token from Bing Webmaster Tools. Paste only the code value, not the full meta tag.',
  ga4_measurement_id:
    'Google Analytics 4 measurement ID for public pages. Format: G- followed by letters and numbers.',
  gtm_container_id:
    'Google Tag Manager container ID injected on public pages. Format: GTM- followed by letters and numbers.',
  plausible_domain:
    'Domain you track in Plausible Analytics, without https. Example: www.example.com.',
  analytics_id:
    'Legacy analytics identifier kept for older integrations. Leave empty unless you still rely on it.',
  vercel_analytics_enabled:
    'When on, Vercel Web Analytics runs on public pages to measure visits without storing cookies in the browser.',
  webhook_url:
    'Optional https endpoint that receives JSON when certain site events occur. Leave empty to disable.',
  redirect_external_hosts:
    'Hostnames allowed as the target of external URL redirects. One host per line without https, such as partners.example.com.',
} as const

export type SettingsFieldHelpKey = keyof typeof SETTINGS_FIELD_HELP
