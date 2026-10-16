import '@tanstack/react-start/server-only'

import { getRequest } from '@tanstack/react-start/server'
import { setResponseHeader } from '@tanstack/react-start/server'

const timingByRequest = new WeakMap<Request, string[]>()

export function appendServerTiming(fragment: string) {
  const request = getRequest()
  const list = timingByRequest.get(request) ?? []
  list.push(fragment)
  timingByRequest.set(request, list)
  setResponseHeader('Server-Timing', list.join(', '))
}
