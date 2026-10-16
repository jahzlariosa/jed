import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
} from 'react'

import {
  adjustSidebarWidthByKeyboard,
  clampWritingDeskSidebarWidth,
  parseWritingDeskSplitStorage,
  resolveInitialSidebarWidth,
  serializeWritingDeskSplitStorage,
  writingDeskSidebarBounds,
  WRITING_DESK_SPLIT,
} from '#/lib/admin/writing-desk-split'

type UseWritingDeskSplitResult = {
  rootRef: RefObject<HTMLDivElement | null>
  stacked: boolean
  sidebarWidth: number
  sidebarHidden: boolean
  toggleSidebar: () => void
  separatorProps: {
    role: 'separator'
    'aria-orientation': 'vertical'
    'aria-valuenow': number
    'aria-valuemin': number
    'aria-valuemax': number
    'aria-label': string
    tabIndex: number
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => void
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => void
    onPointerUp: (event: PointerEvent<HTMLDivElement>) => void
    onPointerCancel: (event: PointerEvent<HTMLDivElement>) => void
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void
    onDoubleClick: () => void
  }
  sidebarStyle: { width: string } | undefined
}

export function useWritingDeskSplit(): UseWritingDeskSplitResult {
  const rootRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const dragOriginRef = useRef({ pointerX: 0, width: 0 })
  const [stacked, setStacked] = useState(true)
  const [sidebarWidth, setSidebarWidth] = useState<number>(
    WRITING_DESK_SPLIT.defaultPx,
  )
  const [sidebarHidden, setSidebarHidden] = useState(false)
  const hydratedRef = useRef(false)

  const containerWidthRef = useRef(1200)

  useEffect(() => {
    const mq = window.matchMedia(WRITING_DESK_SPLIT.stackMediaQuery)
    const update = () => setStacked(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const raw = localStorage.getItem(WRITING_DESK_SPLIT.storageKey)
    const parsed = parseWritingDeskSplitStorage(raw)
    if (parsed?.hidden) {
      setSidebarHidden(true)
    }
    const width = resolveInitialSidebarWidth(
      parsed,
      rootRef.current?.clientWidth ?? 1200,
    )
    setSidebarWidth(width)
    hydratedRef.current = true
  }, [])

  useEffect(() => {
    if (!hydratedRef.current) {
      return
    }
    localStorage.setItem(
      WRITING_DESK_SPLIT.storageKey,
      serializeWritingDeskSplitStorage({
        widthPx: sidebarWidth,
        hidden: sidebarHidden,
      }),
    )
  }, [sidebarWidth, sidebarHidden])

  useEffect(() => {
    const el = rootRef.current
    if (!el) {
      return
    }
    containerWidthRef.current = el.clientWidth
    const ro = new ResizeObserver(() => {
      const cw = el.clientWidth
      containerWidthRef.current = cw
      setSidebarWidth((current) => clampWritingDeskSidebarWidth(current, cw))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const endDrag = useCallback((target: HTMLDivElement, pointerId: number) => {
    draggingRef.current = false
    if (target.hasPointerCapture(pointerId)) {
      target.releasePointerCapture(pointerId)
    }
  }, [])

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (stacked) {
        return
      }
      event.preventDefault()
      draggingRef.current = true
      dragOriginRef.current = {
        pointerX: event.clientX,
        width: sidebarWidth,
      }
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    [sidebarWidth, stacked],
  )

  const onPointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) {
      return
    }
    const delta = event.clientX - dragOriginRef.current.pointerX
    const next = dragOriginRef.current.width - delta
    setSidebarWidth(
      clampWritingDeskSidebarWidth(next, containerWidthRef.current),
    )
  }, [])

  const onPointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      endDrag(event.currentTarget, event.pointerId)
    },
    [endDrag],
  )

  const onPointerCancel = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      endDrag(event.currentTarget, event.pointerId)
    },
    [endDrag],
  )

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (stacked) {
        return
      }
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
        return
      }
      event.preventDefault()
      const next = adjustSidebarWidthByKeyboard(
        sidebarWidth,
        event.key,
        containerWidthRef.current,
      )
      if (next !== null) {
        setSidebarWidth(next)
      }
    },
    [sidebarWidth, stacked],
  )

  const onDoubleClick = useCallback(() => {
    if (stacked) {
      return
    }
    setSidebarWidth(
      clampWritingDeskSidebarWidth(
        WRITING_DESK_SPLIT.defaultPx,
        containerWidthRef.current,
      ),
    )
  }, [stacked])

  const toggleSidebar = useCallback(() => {
    setSidebarHidden((hidden) => !hidden)
  }, [])

  const bounds = writingDeskSidebarBounds(containerWidthRef.current)
  const showSplit = !stacked && !sidebarHidden

  return {
    rootRef,
    stacked,
    sidebarWidth,
    sidebarHidden,
    toggleSidebar,
    sidebarStyle: showSplit ? { width: `${sidebarWidth}px` } : undefined,
    separatorProps: {
      role: 'separator',
      'aria-orientation': 'vertical',
      'aria-valuenow': sidebarWidth,
      'aria-valuemin': bounds.min,
      'aria-valuemax': bounds.max,
      'aria-label': 'Resize editor sidebar',
      tabIndex: showSplit ? 0 : -1,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onKeyDown,
      onDoubleClick,
    },
  }
}
