import { isRedirect } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

const CLIENT_SAFE_ERROR = 'Something went wrong. Try again.'

export function useAuthSubmit() {
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  async function run(
    // biome-ignore lint/suspicious/noConfusingVoidType: actions may return nothing (success) or an error string
    action: (mounted: () => boolean) => Promise<string | void>,
  ) {
    setPending(true)
    setError('')

    try {
      const message = await action(() => alive.current)
      if (!alive.current) {
        return
      }
      if (message) {
        setError(message)
      }
    } catch (thrown) {
      if (isRedirect(thrown)) {
        throw thrown
      }
      if (alive.current) {
        setError(CLIENT_SAFE_ERROR)
      }
    } finally {
      if (alive.current) {
        setPending(false)
      }
    }
  }

  return { error, pending, run, setError }
}
