import { createFileRoute } from '@tanstack/react-router'

import { StructuredData } from '#/components/seo/structured-data'
import { HomePage } from '#/components/marketing/home-page'
import { getHomeRouteLoaderFn } from '#/lib/seo/public-route-fns'
import { marketingRouteHead } from '#/lib/seo/marketing-head'
import { PUBLIC_CACHE_HEADERS } from '#/lib/seo'

export const Route = createFileRoute('/')({
  staleTime: Infinity,
  headers: () => PUBLIC_CACHE_HEADERS,
  loader: () => getHomeRouteLoaderFn(),
  head: ({ matches }) => marketingRouteHead('/', matches),
  component: Home,
})

function Home() {
  const { marketing, jsonLd } = Route.useLoaderData()
  return (
    <>
      <StructuredData json={jsonLd} />
      <HomePage marketing={marketing} />
    </>
  )
}
