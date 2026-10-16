import { useCallback, useEffect, useState } from 'react'

import {
  shouldEnableSlugTitleSyncOnLoad,
  slugifyEditorTitle,
} from '#/lib/cms/editor-slug'

export function useEditorSlugFromTitle({
  slugLockedPublished,
  initialTitle,
  initialSlug,
  setSlug,
}: {
  slugLockedPublished: boolean
  initialTitle: string
  initialSlug: string
  setSlug: (slug: string) => void
}) {
  const [slugSyncedFromTitle, setSlugSyncedFromTitle] = useState(() =>
    shouldEnableSlugTitleSyncOnLoad(
      slugLockedPublished,
      initialTitle,
      initialSlug,
    ),
  )

  useEffect(() => {
    if (slugLockedPublished) {
      setSlugSyncedFromTitle(false)
    }
  }, [slugLockedPublished])

  const onSlugChange = useCallback(
    (value: string) => {
      setSlugSyncedFromTitle(false)
      setSlug(value)
    },
    [setSlug],
  )

  const applyTitleToSlug = useCallback(
    (title: string) => {
      if (!slugLockedPublished && slugSyncedFromTitle) {
        setSlug(slugifyEditorTitle(title))
      }
    },
    [slugLockedPublished, setSlug, slugSyncedFromTitle],
  )

  return { onSlugChange, applyTitleToSlug }
}
