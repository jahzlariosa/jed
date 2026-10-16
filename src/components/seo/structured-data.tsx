import { getScriptNonce } from '#/components/seo/script-nonce'

export function StructuredData({ json }: { json: string | null | undefined }) {
  if (!json) {
    return null
  }
  const safe = json.replace(/</g, '\\u003c')
  const nonce = getScriptNonce()
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is server-serialized; angle brackets are escaped.
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  )
}
