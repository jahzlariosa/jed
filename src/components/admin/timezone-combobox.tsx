import { CaretDown } from '@phosphor-icons/react'
import {
  type KeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'

import { AdminFieldLabel } from '#/components/admin/admin-field-label'
import type { SettingsFieldHelpKey } from '#/lib/admin/settings-help'
import {
  formatTimeZoneOptionLabel,
  getIanaTimeZoneIds,
  isKnownIanaTimeZoneId,
} from '#/lib/iana-timezones'
import { phosphorIcon } from '#/lib/icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const MAX_VISIBLE_OPTIONS = 80

function buildOptionIds(value: string): readonly string[] {
  const known = getIanaTimeZoneIds()
  if (!value || isKnownIanaTimeZoneId(value)) {
    return known
  }
  if (known.includes(value)) {
    return known
  }
  return [value, ...known]
}

function filterTimeZones(ids: readonly string[], query: string): string[] {
  const q = query.trim().toLowerCase()
  if (!q) {
    return ids.slice(0, MAX_VISIBLE_OPTIONS)
  }
  const matches: string[] = []
  for (const id of ids) {
    if (id.toLowerCase().includes(q)) {
      matches.push(id)
      if (matches.length >= MAX_VISIBLE_OPTIONS) {
        break
      }
    }
  }
  return matches
}

export function TimezoneCombobox({
  label,
  helpKey,
  value,
  onChange,
}: {
  label: string
  helpKey: SettingsFieldHelpKey
  value: string
  onChange: (value: string) => void
}) {
  const listboxId = useId()
  const searchId = useId()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const allIds = useMemo(() => buildOptionIds(value), [value])
  const options = useMemo(
    () => filterTimeZones(allIds, search),
    [allIds, search],
  )

  const triggerLabel = value
    ? formatTimeZoneOptionLabel(value)
    : 'Select timezone'

  useEffect(() => {
    if (!open) {
      setSearch('')
      setActiveIndex(0)
      return
    }
    const id = window.requestAnimationFrame(() => {
      searchRef.current?.focus()
    })
    return () => window.cancelAnimationFrame(id)
  }, [open])

  function selectZone(zone: string) {
    onChange(zone)
    setOpen(false)
  }

  function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => Math.min(index + 1, options.length - 1))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
      return
    }
    if (event.key === 'Enter' && options[activeIndex]) {
      event.preventDefault()
      selectZone(options[activeIndex])
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
    }
  }

  useEffect(() => {
    if (!open || !listRef.current) {
      return
    }
    const active = listRef.current.querySelector<HTMLElement>(
      `[data-timezone-index="${activeIndex}"]`,
    )
    active?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, open])

  return (
    <div>
      <AdminFieldLabel label={label} helpKey={helpKey} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="admin-input-tall mt-1 w-full justify-between font-normal"
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-haspopup="listbox"
          >
            <span className="truncate text-left">{triggerLabel}</span>
            <CaretDown
              className="size-4 shrink-0 opacity-60"
              {...phosphorIcon}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <div className="border-b border-border p-2">
            <Input
              ref={searchRef}
              id={searchId}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setActiveIndex(0)
              }}
              onKeyDown={onSearchKeyDown}
              placeholder="Search timezones"
              aria-controls={listboxId}
              aria-autocomplete="list"
              autoComplete="off"
              className="h-9"
            />
          </div>
          <div
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-label="Timezones"
            className="max-h-60 overflow-y-auto p-1"
          >
            {options.length === 0 ? (
              <p className="px-2 py-3 text-sm text-muted-foreground">
                No matching timezones.
              </p>
            ) : (
              options.map((zone, index) => {
                const selected = zone === value
                const active = index === activeIndex
                return (
                  <button
                    key={zone}
                    type="button"
                    role="option"
                    data-timezone-index={index}
                    aria-selected={selected}
                    className={cn(
                      'flex w-full rounded-md px-2 py-2 text-left text-sm',
                      active && 'bg-accent text-accent-foreground',
                      !active && 'hover:bg-accent/60',
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectZone(zone)}
                  >
                    {formatTimeZoneOptionLabel(zone)}
                  </button>
                )
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
