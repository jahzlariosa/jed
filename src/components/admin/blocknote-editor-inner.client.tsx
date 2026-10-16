import '@blocknote/core/fonts/inter.css'
import '@blocknote/shadcn/style.css'

import {
  FileCaptionButton,
  FormattingToolbar,
  FormattingToolbarController,
  SideMenu,
  SideMenuController,
  getFormattingToolbarItems,
  useBlockNoteEditor,
  useCreateBlockNote,
} from '@blocknote/react'
import { ImageSquare } from '@phosphor-icons/react'
import { BlockNoteView } from '@blocknote/shadcn'
import { useEffect, useRef, useState } from 'react'

import { phosphorIcon } from '#/lib/icon'

import {
  clipboardImageFile,
  insertEditorImageFromFile,
} from '#/lib/admin/admin-blocknote-images.client'
import type { BlockNoteDocument } from '#/lib/cms/blocknote-types'
import { AMIANAN_CONTENT_CLASS } from '#/lib/cms/content-surface'
import { cn } from '@/lib/utils'

function InsertImageToolbarButton({
  uploadFile,
}: {
  uploadFile: (file: File) => Promise<string>
}) {
  const editor = useBlockNoteEditor()
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <>
      <button
        type="button"
        className="bn-formatting-toolbar-button"
        aria-label="Insert image"
        onClick={() => inputRef.current?.click()}
      >
        <ImageSquare {...phosphorIcon} className="size-4" aria-hidden />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (!file) {
            return
          }
          void insertEditorImageFromFile({
            editor,
            file,
            uploadFile,
          }).catch((cause) => {
            console.error(cause)
          })
          event.target.value = ''
        }}
      />
    </>
  )
}

function AdminFormattingToolbar({
  uploadFile,
}: {
  uploadFile: (file: File) => Promise<string>
}) {
  return (
    <FormattingToolbar>
      <InsertImageToolbarButton uploadFile={uploadFile} />
      {getFormattingToolbarItems()}
      <FileCaptionButton />
    </FormattingToolbar>
  )
}

export function BlockNoteEditorInner({
  initialBlocks,
  onChange,
  uploadFile,
  theme,
}: {
  initialBlocks: BlockNoteDocument
  onChange: (blocks: BlockNoteDocument) => void
  uploadFile: (file: File) => Promise<string>
  theme: 'light' | 'dark'
}) {
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const uploadRef = useRef(uploadFile)
  uploadRef.current = uploadFile
  const [portalRoot, setPortalRoot] = useState<HTMLDivElement | null>(null)

  const editor = useCreateBlockNote({
    initialContent:
      initialBlocks.length > 0 ? initialBlocks : [{ type: 'paragraph' }],
    uploadFile: async (file: File) => uploadRef.current(file),
  })

  useEffect(() => {
    return editor.onChange(() => {
      onChangeRef.current(editor.document)
    })
  }, [editor])

  useEffect(() => {
    const root = portalRoot
    if (!root) {
      return
    }
    const onPaste = (event: ClipboardEvent) => {
      const file = clipboardImageFile(event.clipboardData)
      if (!file) {
        return
      }
      event.preventDefault()
      void insertEditorImageFromFile({
        editor,
        file,
        uploadFile: (next) => uploadRef.current(next),
      }).catch((cause) => {
        console.error(cause)
      })
    }
    const onDragOver = (event: DragEvent) => {
      if (event.dataTransfer?.types.includes('Files')) {
        event.preventDefault()
      }
    }
    const onDrop = (event: DragEvent) => {
      const file = event.dataTransfer?.files?.[0]
      if (!file?.type.startsWith('image/')) {
        return
      }
      event.preventDefault()
      void insertEditorImageFromFile({
        editor,
        file,
        uploadFile: (next) => uploadRef.current(next),
      }).catch((cause) => {
        console.error(cause)
      })
    }
    root.addEventListener('paste', onPaste)
    root.addEventListener('dragover', onDragOver)
    root.addEventListener('drop', onDrop)
    return () => {
      root.removeEventListener('paste', onPaste)
      root.removeEventListener('dragover', onDragOver)
      root.removeEventListener('drop', onDrop)
    }
  }, [editor, portalRoot])

  return (
    <div
      ref={setPortalRoot}
      className={cn(
        AMIANAN_CONTENT_CLASS,
        'bn-editor-shell min-h-[min(50vh,520px)] overflow-visible border-0 bg-transparent shadow-none',
      )}
    >
      <BlockNoteView
        editor={editor}
        theme={theme}
        formattingToolbar={false}
        sideMenu={false}
        slashMenu={true}
        linkToolbar={true}
        tableHandles={true}
        portalElements={portalRoot ? { default: portalRoot } : undefined}
      >
        <FormattingToolbarController
          formattingToolbar={() => (
            <AdminFormattingToolbar
              uploadFile={(file) => uploadRef.current(file)}
            />
          )}
        />
        <SideMenuController sideMenu={(props) => <SideMenu {...props} />} />
      </BlockNoteView>
    </div>
  )
}
