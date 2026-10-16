export function optimizedCoverImageUrl(
  url: string | null | undefined,
): string | null {
  const trimmed = url?.trim()
  if (!trimmed) {
    return null
  }
  if (!trimmed.includes('/storage/v1/object/public/')) {
    return trimmed
  }
  const separator = trimmed.includes('?') ? '&' : '?'
  return `${trimmed}${separator}width=1200&height=600&resize=cover&format=webp`
}
