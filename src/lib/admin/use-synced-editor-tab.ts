import { useCallback, useEffect, useState } from 'react'

export function normalizeEditorTab<T extends string>(
  value: string | undefined,
  validTabs: readonly T[],
  defaultTab: T,
): T {
  if (value && (validTabs as readonly string[]).includes(value)) {
    return value as T
  }
  return defaultTab
}

export function useSyncedEditorTab<T extends string>(input: {
  urlTab: T
  validTabs: readonly T[]
  defaultTab: T
  onUrlTabChange: (tab: T) => void
}) {
  const resolveTab = useCallback(
    (value: string | undefined): T =>
      normalizeEditorTab(value, input.validTabs, input.defaultTab),
    [input.defaultTab, input.validTabs],
  )

  const [activeTab, setActiveTab] = useState<T>(() => resolveTab(input.urlTab))

  useEffect(() => {
    setActiveTab(resolveTab(input.urlTab))
  }, [input.urlTab, resolveTab])

  const { onUrlTabChange } = input

  const setTab = useCallback(
    (tab: T) => {
      setActiveTab(tab)
      onUrlTabChange(tab)
    },
    [onUrlTabChange],
  )

  return { activeTab, setTab }
}
