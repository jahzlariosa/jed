import { BlockNoteEditor } from '@blocknote/core'

import {
  type BlockNoteDocument,
  emptyBlockDocument,
} from '#/lib/cms/blocknote-types'

let editorSingleton: BlockNoteEditor | null = null

function getClientEditor() {
  if (!editorSingleton) {
    editorSingleton = BlockNoteEditor.create()
  }
  return editorSingleton
}

export function blocksToPublicHtmlClient(blocks: BlockNoteDocument): string {
  const editor = getClientEditor()
  const normalized = blocks.length > 0 ? blocks : emptyBlockDocument()
  return editor.blocksToFullHTML(normalized)
}

export function htmlToBlocksClient(html: string): BlockNoteDocument {
  const trimmed = html.trim()
  if (!trimmed || trimmed === '<p></p>') {
    return emptyBlockDocument()
  }
  const editor = getClientEditor()
  try {
    const blocks = editor.tryParseHTMLToBlocks(trimmed)
    return blocks.length > 0
      ? (blocks as BlockNoteDocument)
      : emptyBlockDocument()
  } catch (error) {
    console.error('blocknote html parse failed', error)
    return emptyBlockDocument()
  }
}
