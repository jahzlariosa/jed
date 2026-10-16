import { getScriptNonce } from '#/components/seo/script-nonce'

type AnalyticsConfig = {
  ga4MeasurementId: string | null
  gtmContainerId: string | null
}

/** SSR GA4 bootstrap so public CSP can allow it via inline script hashes. */
export function SiteAnalyticsScripts({ config }: { config: AnalyticsConfig }) {
  if (config.gtmContainerId || !config.ga4MeasurementId) {
    return null
  }
  const id = config.ga4MeasurementId
  const nonce = getScriptNonce()
  const inline = [
    'window.dataLayer = window.dataLayer || [];',
    'function gtag(){dataLayer.push(arguments);}',
    "gtag('js', new Date());",
    `gtag('config', '${id}');`,
  ].join('\n')
  return (
    <>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        nonce={nonce}
      />
      <script
        nonce={nonce}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: GA4 id is DB-validated (G-[A-Z0-9]+).
        dangerouslySetInnerHTML={{ __html: inline }}
      />
    </>
  )
}
