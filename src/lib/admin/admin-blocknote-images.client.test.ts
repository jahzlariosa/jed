import { describe, expect, it, vi } from 'vitest'

import {
  clipboardImageFile,
  insertEditorImageFromFile,
} from './admin-blocknote-images.client'

describe('clipboardImageFile', () => {
  it('returns an image file from clipboard items', () => {
    const file = new File([new Uint8Array(4)], 'paste.png', {
      type: 'image/png',
    })
    const data = {
      files: [] as File[],
      items: [
        {
          type: 'image/png',
          getAsFile: () => file,
        },
      ],
    } as unknown as DataTransfer
    expect(clipboardImageFile(data)).toBe(file)
  })
})

describe('insertEditorImageFromFile', () => {
  it('uploads and inserts an image block after the cursor', async () => {
    const block = { id: 'b1', type: 'paragraph', props: {}, content: [] }
    const insertBlocks = vi.fn()
    const editor = {
      getTextCursorPosition: () => ({ block }),
      insertBlocks,
    }
    const file = new File([new Uint8Array(4)], 'diagram.png', {
      type: 'image/png',
    })
    await insertEditorImageFromFile({
      editor: editor as never,
      file,
      uploadFile: async () => 'https://example.com/media/diagram.png',
      altText: 'Diagram',
    })
    expect(insertBlocks).toHaveBeenCalledWith(
      [
        {
          type: 'image',
          props: {
            url: 'https://example.com/media/diagram.png',
            name: 'diagram',
            caption: 'Diagram',
          },
        },
      ],
      block,
      'after',
    )
  })
})
