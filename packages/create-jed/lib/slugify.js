/**
 * Turn a folder or display name into a valid npm package name segment.
 * @param {string} input
 * @returns {string}
 */
export function slugify(input) {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^[._-]+|[._-]+$/g, '')
    .replace(/-+/g, '-')

  if (!base) {
    return 'my-site'
  }
  if (/^\d/.test(base)) {
    return `site-${base}`
  }
  return base
}
