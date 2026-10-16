export function slugFromDocFile(filePath: string): string {
  const name = filePath.split('/').pop() ?? ''
  return name.replace(/\.md$/, '')
}

export function docPathFromFileSlug(fileSlug: string): string {
  if (fileSlug === 'index') {
    return '/docs'
  }
  return `/docs/${fileSlug}`
}

export function routeSlugFromFileSlug(fileSlug: string): string | undefined {
  if (fileSlug === 'index') {
    return undefined
  }
  return fileSlug
}
