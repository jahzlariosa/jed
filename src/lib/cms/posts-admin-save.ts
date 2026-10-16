import type { PostgrestError } from '@supabase/supabase-js'

type PostsClient = {
  from: (table: string) => {
    insert: (
      values: Record<string, unknown>,
    ) => PromiseLike<{ error: PostgrestError | null }>
  }
}

export function newAdminPostId(): string {
  return crypto.randomUUID()
}

/** Insert without `.select()` so draft rows are not blocked by public SELECT RLS on RETURNING. */
export async function insertAdminPost(
  supabase: PostsClient,
  payload: Record<string, unknown>,
  id: string,
): Promise<{ id: string; slug: string } | { error: PostgrestError }> {
  const { error } = await supabase.from('posts').insert({ ...payload, id })
  if (error) {
    return { error }
  }
  const slug = payload.slug
  if (typeof slug !== 'string') {
    throw new Error('insertAdminPost: payload.slug must be a string')
  }
  return { id, slug }
}
