import { useRouterState } from '@tanstack/react-router'

export function RouteTransitionIndicator() {
  const isLoading = useRouterState({ select: (s) => s.isLoading })
  if (!isLoading) {
    return null
  }
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 bg-primary motion-safe:animate-pulse"
      aria-hidden
    />
  )
}
