import type { AuditRangePreset } from '#/lib/admin/audit-directory-query'
import type { AuditLogFilterOptions } from '#/lib/admin/audit-directory.server'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const PRESETS: Array<{ id: AuditRangePreset; label: string }> = [
  { id: '1h', label: 'Last hour' },
  { id: '24h', label: '24 hours' },
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
]

export function AuditToolbar({
  q,
  action,
  actorId,
  targetType,
  fromLocal,
  toLocal,
  preset,
  siteTimezone,
  filters,
  onSearchChange,
  onActionChange,
  onActorChange,
  onTargetTypeChange,
  onFromLocalChange,
  onToLocalChange,
  onPresetChange,
  onClearRange,
}: {
  q: string
  action?: string
  actorId?: string
  targetType?: string
  fromLocal: string
  toLocal: string
  preset?: AuditRangePreset
  siteTimezone: string
  filters: AuditLogFilterOptions
  onSearchChange: (q: string) => void
  onActionChange: (action: string | undefined) => void
  onActorChange: (actorId: string | undefined) => void
  onTargetTypeChange: (targetType: string | undefined) => void
  onFromLocalChange: (value: string) => void
  onToLocalChange: (value: string) => void
  onPresetChange: (preset: AuditRangePreset) => void
  onClearRange: () => void
}) {
  return (
    <div className="admin-users-toolbar">
      <div className="admin-users-toolbar-filters">
        <Input
          id="audit-search"
          type="search"
          value={q}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search action, target, or id"
          className="admin-users-toolbar-search"
          autoComplete="off"
          aria-label="Search audit log"
        />
        <div className="admin-users-toolbar-select-wrap">
          <Label htmlFor="audit-filter-actor" className="sr-only">
            Actor
          </Label>
          <select
            id="audit-filter-actor"
            className="admin-users-toolbar-select"
            value={actorId ?? ''}
            onChange={(event) => onActorChange(event.target.value || undefined)}
          >
            <option value="">All actors</option>
            {filters.actors.map((actor) => (
              <option key={actor.userId} value={actor.userId}>
                {actor.label}
              </option>
            ))}
          </select>
        </div>
        <div className="admin-users-toolbar-select-wrap">
          <Label htmlFor="audit-filter-action" className="sr-only">
            Action
          </Label>
          <select
            id="audit-filter-action"
            className="admin-users-toolbar-select"
            value={action ?? ''}
            onChange={(event) =>
              onActionChange(event.target.value || undefined)
            }
          >
            <option value="">All actions</option>
            {filters.actions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div className="admin-users-toolbar-select-wrap">
          <Label htmlFor="audit-filter-target-type" className="sr-only">
            Target type
          </Label>
          <select
            id="audit-filter-target-type"
            className="admin-users-toolbar-select"
            value={targetType ?? ''}
            onChange={(event) =>
              onTargetTypeChange(event.target.value || undefined)
            }
          >
            <option value="">All target types</option>
            {filters.targetTypes.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div className="admin-users-toolbar-date">
          <Label htmlFor="audit-from" className="sr-only">
            From
          </Label>
          <Input
            id="audit-from"
            type="datetime-local"
            value={fromLocal}
            onChange={(event) => onFromLocalChange(event.target.value)}
            className="admin-users-toolbar-date-input"
            aria-label={`From (${siteTimezone})`}
          />
        </div>
        <div className="admin-users-toolbar-date">
          <Label htmlFor="audit-to" className="sr-only">
            To
          </Label>
          <Input
            id="audit-to"
            type="datetime-local"
            value={toLocal}
            onChange={(event) => onToLocalChange(event.target.value)}
            className="admin-users-toolbar-date-input"
            aria-label={`To (${siteTimezone})`}
          />
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {PRESETS.map((item) => (
            <Button
              key={item.id}
              type="button"
              size="sm"
              variant={preset === item.id ? 'default' : 'outline'}
              onClick={() => onPresetChange(item.id)}
            >
              {item.label}
            </Button>
          ))}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onClearRange}
          >
            Clear range
          </Button>
        </div>
      </div>
    </div>
  )
}
