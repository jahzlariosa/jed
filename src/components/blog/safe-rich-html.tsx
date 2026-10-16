import { AMIANAN_CONTENT_CLASS } from '#/lib/cms/content-surface'
import { sanitizeRichHtml } from '#/lib/cms/sanitize'

export function SafeRichHtml({ html }: { html: string }) {
  const safe = sanitizeRichHtml(html)
  return (
    <div
      className={AMIANAN_CONTENT_CLASS}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  )
}
