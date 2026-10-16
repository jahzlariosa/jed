import { useEffect } from 'react'

type AnalyticsConfig = {
  ga4MeasurementId: string | null
  gtmContainerId: string | null
  plausibleDomain: string | null
  vercelAnalyticsEnabled: boolean
}

function appendScript(src: string, attrs?: Record<string, string>) {
  if (document.querySelector(`script[src="${src}"]`)) {
    return
  }
  const script = document.createElement('script')
  script.src = src
  script.async = true
  for (const [key, value] of Object.entries(attrs ?? {})) {
    script.setAttribute(key, value)
  }
  document.head.append(script)
}

export function SiteAnalytics({ config }: { config: AnalyticsConfig }) {
  useEffect(() => {
    if (config.gtmContainerId) {
      appendScript(
        `https://www.googletagmanager.com/gtm.js?id=${config.gtmContainerId}`,
      )
      return
    }
    if (config.plausibleDomain) {
      appendScript('https://plausible.io/js/script.js', {
        'data-domain': config.plausibleDomain,
      })
    }
    if (config.vercelAnalyticsEnabled) {
      appendScript('/_vercel/insights/script.js')
    }
  }, [config])

  return null
}
