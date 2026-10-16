import { cn } from '@/lib/utils'

export type AdminFilterPill = {
  key: string
  label: string
  count: number
}

export function AdminFilterPills({
  pills,
  activeKey,
  onChange,
  ariaLabel,
}: {
  pills: readonly AdminFilterPill[]
  activeKey: string
  onChange: (key: string) => void
  ariaLabel: string
}) {
  return (
    <div className="admin-filter-pills" role="tablist" aria-label={ariaLabel}>
      {pills.map((pill) => {
        const active = pill.key === activeKey
        return (
          <button
            key={pill.key}
            type="button"
            role="tab"
            aria-selected={active}
            className={cn('admin-filter-pill', active && 'active')}
            onClick={() => onChange(pill.key)}
          >
            {pill.label}
            <span className="admin-filter-pill-count">{pill.count}</span>
          </button>
        )
      })}
    </div>
  )
}
