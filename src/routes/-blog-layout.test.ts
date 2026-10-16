import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('blog route layout', () => {
  it('parent /blog renders an Outlet so post and RSS child routes mount', () => {
    const layout = readFileSync(
      join(process.cwd(), 'src/routes/blog.tsx'),
      'utf8',
    )
    expect(layout).toContain('Outlet')
    expect(layout).not.toContain('BlogIndexScreen')
  })

  it('blog index is registered on /blog/', () => {
    const index = readFileSync(
      join(process.cwd(), 'src/routes/blog.index.tsx'),
      'utf8',
    )
    expect(index).toContain("createFileRoute('/blog/')")
  })
})
