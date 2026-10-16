import { cn } from '@/lib/utils'

const STATUS_CLASS: Record<string, string> = {
  published: 'admin-status-published',
  draft: 'admin-status-draft',
  scheduled: 'admin-status-scheduled',
}

export function AdminStatusBadge({
  status,
  label,
  className,
}: {
  status: string
  label?: string
  className?: string
}) {
  const key = status.toLowerCase()
  const tone = STATUS_CLASS[key] ?? 'admin-status-draft'
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
        tone,
        className,
      )}
    >
      {label ?? status}
    </span>
  )
}
