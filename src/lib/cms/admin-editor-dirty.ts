import type { BlockNoteDocument } from '#/lib/cms/blocknote-types'

export function blocksSnapshotEqual(
  a: BlockNoteDocument,
  b: BlockNoteDocument,
): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function parseTagsField(tags: string): string[] {
  return tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

export function tagsFieldEqual(tags: string, saved: string[]): boolean {
  const next = parseTagsField(tags)
  if (next.length !== saved.length) {
    return false
  }
  return next.every((tag, index) => tag === saved[index])
}
