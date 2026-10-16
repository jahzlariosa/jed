import { Skeleton } from '@/components/ui/skeleton'

export function AdminRoutePending() {
  return (
    <div className="space-y-4 p-4 md:p-6" aria-busy="true" aria-live="polite">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-4 w-full max-w-md" />
      <div className="grid gap-3 pt-2 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-48 w-full" />
    </div>
  )
}
