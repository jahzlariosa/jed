import { Link, useMatches } from '@tanstack/react-router'
import { useLayoutEffect } from 'react'

import { ErrorPage } from '#/components/errors/error-page'
import { pageTitle, seoContextFromMatches } from '#/lib/seo'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  const matches = useMatches()
  useLayoutEffect(() => {
    document.title = pageTitle('Page not found', seoContextFromMatches(matches))
    let robots = document.querySelector('meta[name="robots"]')
    if (!robots) {
      robots = document.createElement('meta')
      robots.setAttribute('name', 'robots')
      document.head.appendChild(robots)
    }
    robots.setAttribute('content', 'noindex, nofollow')
    const canonical = document.querySelector('link[rel="canonical"]')
    canonical?.remove()
    const ogUrl = document.querySelector('meta[property="og:url"]')
    ogUrl?.remove()
  }, [matches])

  return (
    <ErrorPage
      code="404"
      title="Page not found"
      description="That address does not exist, or it moved. Check the link and try again."
    >
      <Button asChild className="rounded-full">
        <Link to="/">Back to home</Link>
      </Button>
    </ErrorPage>
  )
}
