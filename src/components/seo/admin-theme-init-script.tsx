import { adminThemeInitScript } from '#/lib/admin/admin-theme'
import { getScriptNonce } from '#/components/seo/script-nonce'

export function AdminThemeInitScript() {
  const nonce = getScriptNonce()
  return (
    <script
      nonce={nonce}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: static admin theme bootstrap script
      dangerouslySetInnerHTML={{ __html: adminThemeInitScript() }}
    />
  )
}
