import type { BlockNoteEditor } from '@blocknote/core'

export async function insertEditorImageFromFile(input: {
  editor: BlockNoteEditor
  file: File
  uploadFile: (file: File) => Promise<string>
  altText?: string
}) {
  const url = await input.uploadFile(input.file)
  const position = input.editor.getTextCursorPosition()
  const name = input.file.name.replace(/\.[^.]+$/, '') || 'image'
  const caption = input.altText?.trim() || name
  input.editor.insertBlocks(
    [
      {
        type: 'image',
        props: {
          url,
          name,
          caption,
        },
      },
    ],
    position.block,
    'after',
  )
}

export function clipboardImageFile(
  clipboard: DataTransfer | null,
): File | null {
  if (!clipboard) {
    return null
  }
  const fromFiles = Array.from(clipboard.files).find((file) =>
    file.type.startsWith('image/'),
  )
  if (fromFiles) {
    return fromFiles
  }
  for (const item of Array.from(clipboard.items)) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) {
        return file
      }
    }
  }
  return null
}
