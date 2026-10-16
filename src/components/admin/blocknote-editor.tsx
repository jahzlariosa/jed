import { lazy, Suspense, useEffect, useState } from 'react'

import type { BlockNoteDocument } from '#/lib/cms/blocknote-types'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

const BlockNoteEditorInner = lazy(() =>
  import('#/components/admin/blocknote-editor-inner.client').then((module) => ({
    default: module.BlockNoteEditorInner,
  })),
)

function EditorSkeleton() {
  return <Skeleton className="min-h-[min(70vh,640px)] w-full rounded-lg" />
}

function useAdminEditorTheme(): 'light' | 'dark' {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const root = document.documentElement
    const read = () => {
      const admin = document.querySelector('.jed-admin')
      const attr =
        admin?.getAttribute('data-theme') ??
        root.getAttribute('data-admin-theme')
      setTheme(attr === 'dark' ? 'dark' : 'light')
    }
    read()
    const observer = new MutationObserver(read)
    const admin = document.querySelector('.jed-admin')
    if (admin) {
      observer.observe(admin, {
        attributes: true,
        attributeFilter: ['data-theme'],
      })
    }
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-admin-theme'],
    })
    return () => observer.disconnect()
  }, [])

  return theme
}

export function BlockNoteRichTextEditor({
  id,
  label,
  hideLabel,
  documentKey,
  blocks,
  onChange,
  onUploadFile,
}: {
  id: string
  label: string
  hideLabel?: boolean
  documentKey: string
  blocks: BlockNoteDocument
  onChange: (blocks: BlockNoteDocument) => void
  onUploadFile: (file: File) => Promise<string>
}) {
  const theme = useAdminEditorTheme()

  return (
    <div className="grid gap-2">
      {hideLabel ? (
        <span className="sr-only" id={id}>
          {label}
        </span>
      ) : (
        <Label htmlFor={id}>{label}</Label>
      )}
      <Suspense fallback={<EditorSkeleton />}>
        <BlockNoteEditorInner
          key={documentKey}
          initialBlocks={blocks}
          onChange={onChange}
          uploadFile={onUploadFile}
          theme={theme}
        />
      </Suspense>
    </div>
  )
}
