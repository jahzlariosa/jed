import '@blocknote/core/fonts/inter.css'
import '@blocknote/shadcn/style.css'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/shadcn'
import { useEffect } from 'react'

export function ContentBlockEditor({
  initialContent,
  onChange,
}: {
  initialContent: unknown
  onChange: (blocks: unknown) => void
}) {
  const editor = useCreateBlockNote({
    initialContent:
      Array.isArray(initialContent) && initialContent.length > 0
        ? initialContent
        : undefined,
  })

  useEffect(() => {
    return editor.onChange(() => {
      onChange(editor.document)
    })
  }, [editor, onChange])

  return (
    <div className="min-h-[320px] rounded-lg border border-border bg-card p-2">
      <BlockNoteView editor={editor} theme="light" />
    </div>
  )
}
