import {
  Link,
  useRouter,
  type ErrorComponentProps,
} from '@tanstack/react-router'

import { classifyAuthFailure } from '#/auth'
import { ErrorPage } from '#/components/errors/error-page'
import { Button } from '@/components/ui/button'

/**
 * Default error boundary. Shows fixed copy only: the error message, stack and cause can carry
 * SQL, ids or env details and never reach the page. Logging happens in `defaultOnCatch`.
 */
export function RouteErrorPage({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  const failure = classifyAuthFailure(error)

  if (failure === 'forbidden') {
    return (
      <ErrorPage
        code="403"
        title="You do not have access"
        description="Your account is signed in but is not allowed to view this page."
      >
        <Button asChild className="rounded-full">
          <Link to="/account">Back to account</Link>
        </Button>
      </ErrorPage>
    )
  }

  if (failure === 'unauthorized') {
    return (
      <ErrorPage
        code="401"
        title="Sign in to continue"
        description="Your session ended or you are not signed in."
      >
        <Button asChild className="rounded-full">
          <Link to="/login">Sign in</Link>
        </Button>
      </ErrorPage>
    )
  }

  return (
    <ErrorPage
      code="500"
      title="Something went wrong"
      description="We could not finish that request. Try again, or head back home."
    >
      <Button
        type="button"
        className="rounded-full"
        onClick={() => {
          reset()
          void router.invalidate()
        }}
      >
        Try again
      </Button>
      <Button asChild variant="outline" className="rounded-full">
        <Link to="/">Back to home</Link>
      </Button>
    </ErrorPage>
  )
}
