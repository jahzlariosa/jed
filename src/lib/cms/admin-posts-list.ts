import type { AdminPostsListQuery } from '#/lib/cms/schemas'

export type PostsListStatusCounts = {
  all: number
  published: number
  draft: number
  scheduled: number
  trash: number
}

export function sumPostsAllTabCount(
  counts: Pick<PostsListStatusCounts, 'published' | 'draft' | 'scheduled'>,
) {
  return counts.published + counts.draft + counts.scheduled
}

export function postsListMonthRange(month: string): {
  start: string
  end: string
} {
  const [year, monthNum] = month.split('-').map(Number)
  const start = new Date(Date.UTC(year, monthNum - 1, 1)).toISOString()
  const end = new Date(Date.UTC(year, monthNum, 1)).toISOString()
  return { start, end }
}

export function postsListSearchTerm(q: string | undefined): string | null {
  const trimmed = q?.trim()
  if (!trimmed) {
    return null
  }
  return `%${trimmed.replace(/[%_]/g, '')}%`
}

export type PostsListQueryInput = AdminPostsListQuery
