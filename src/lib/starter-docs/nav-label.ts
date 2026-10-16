/** Sidebar and search labels (intro page uses "Docs", not frontmatter "Documentation"). */
export function starterDocNavLabel(entry: {
  fileSlug: string
  title: string
}): string {
  if (entry.fileSlug === 'index') {
    return 'Docs'
  }
  return entry.title
}
