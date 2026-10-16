import type { PartialBlock } from '@blocknote/core'
import { z } from 'zod'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export const blockNoteDocumentSchema = z
  .array(z.record(z.string(), z.unknown()))
  .max(500)

export type BlockNoteDocument = PartialBlock[]

export function emptyBlockDocument(): BlockNoteDocument {
  return [{ type: 'paragraph', content: [] }]
}

export function blocksToJson(blocks: BlockNoteDocument): Json {
  return JSON.parse(JSON.stringify(blocks)) as Json
}

export function parseBlockDocument(raw: unknown): BlockNoteDocument {
  if (raw === null || raw === undefined) {
    return emptyBlockDocument()
  }
  const parsed = blockNoteDocumentSchema.safeParse(raw)
  if (!parsed.success || parsed.data.length === 0) {
    return emptyBlockDocument()
  }
  return parsed.data as BlockNoteDocument
}

export function hasStoredBlocks(stored: BlockNoteDocument): boolean {
  return (
    stored.length > 1 ||
    (stored.length === 1 &&
      stored[0]?.type !== 'paragraph' &&
      JSON.stringify(stored) !== JSON.stringify(emptyBlockDocument()))
  )
}

export function initialEditorBody(body_blocks: unknown, body_html: string) {
  const blocks = parseBlockDocument(body_blocks)
  if (hasStoredBlocks(blocks)) {
    return { blocks, legacyHtml: null as string | null }
  }
  if (body_html.trim()) {
    return { blocks: emptyBlockDocument(), legacyHtml: body_html }
  }
  return { blocks: emptyBlockDocument(), legacyHtml: null as string | null }
}
