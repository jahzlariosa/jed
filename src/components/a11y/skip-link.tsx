/** Id of the single `<main>` landmark on every page that renders a skip link. */
export const MAIN_CONTENT_ID = 'main-content'

/**
 * Visually hidden until focused; first tab stop on a page. The target `<main>` needs
 * `id={MAIN_CONTENT_ID}` and `tabIndex={-1}` so focus actually moves there.
 */
export function SkipLink() {
  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-background focus:ring-3 focus:ring-ring/50 focus:outline-none"
    >
      Skip to content
    </a>
  )
}
