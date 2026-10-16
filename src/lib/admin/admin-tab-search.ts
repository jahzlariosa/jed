import { z } from 'zod'

export function adminTabSearchSchema<
  const T extends readonly [string, ...string[]],
>(ids: T) {
  const fallback = ids[0]
  return z.object({
    tab: z
      .string()
      .optional()
      .transform((value) => {
        if (value && (ids as readonly string[]).includes(value)) {
          return value as T[number]
        }
        return fallback
      }),
  })
}

export type AdminTabSearch<T extends string> = { tab: T }
