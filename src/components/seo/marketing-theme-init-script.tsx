import { getScriptNonce } from '#/components/seo/script-nonce'
import { marketingThemeInitScript } from '#/lib/marketing/marketing-theme'

export function MarketingThemeInitScript() {
  const nonce = getScriptNonce()
  return (
    <script
      nonce={nonce}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: static marketing theme bootstrap script
      dangerouslySetInnerHTML={{ __html: marketingThemeInitScript() }}
    />
  )
}
