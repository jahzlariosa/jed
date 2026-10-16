import { describe, expect, it } from 'vitest'

import { adminTabSearchSchema } from './admin-tab-search'

describe('adminTabSearchSchema', () => {
  const schema = adminTabSearchSchema(['general', 'branding', 'seo'] as const)

  it('falls back to the first tab when tab is missing', () => {
    expect(schema.parse({}).tab).toBe('general')
  })

  it('falls back when tab is invalid', () => {
    expect(schema.parse({ tab: 'unknown' }).tab).toBe('general')
  })

  it('keeps a valid tab', () => {
    expect(schema.parse({ tab: 'seo' }).tab).toBe('seo')
  })
})
