import { GridFour, Table } from '@phosphor-icons/react'

import { phosphorIcon } from '#/lib/icon'
import { cn } from '@/lib/utils'

export type AdminListView = 'table' | 'grid'

export function AdminListViewToggle({
  view,
  onChange,
}: {
  view: AdminListView
  onChange: (view: AdminListView) => void
}) {
  return (
    <fieldset className="admin-view-toggle m-0 min-w-0 border-0 p-0">
      <legend className="sr-only">List layout</legend>
      <button
        type="button"
        className={cn(view === 'table' && 'active')}
        aria-pressed={view === 'table'}
        onClick={() => onChange('table')}
      >
        <Table {...phosphorIcon} className="size-4" aria-hidden />
        <span className="sr-only">Table</span>
      </button>
      <button
        type="button"
        className={cn(view === 'grid' && 'active')}
        aria-pressed={view === 'grid'}
        onClick={() => onChange('grid')}
      >
        <GridFour {...phosphorIcon} className="size-4" aria-hidden />
        <span className="sr-only">Grid</span>
      </button>
    </fieldset>
  )
}
