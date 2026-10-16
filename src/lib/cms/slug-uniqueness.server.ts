import '@tanstack/react-start/server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import { EDITOR_SLUG_MAX, isValidEditorSlug } from '#/lib/cms/editor-slug'
import type { Database } from '#/lib/supabase/database.types'

type Db = SupabaseClient<Database>

/** Suffix probes after the base slug (race losers rely on the unique index). */
export const SLUG_UNIQUENESS_MAX_SUFFIX_ATTEMPTS = 50

async function slugTakenOnTable(
  supabase: Db,
  table: 'posts' | 'content_entries',
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from(table)
    .select('id')
    .eq('slug', slug)
    .limit(1)
    .maybeSingle()
  if (error) {
    console.error(error)
    throw new Error('Unable to verify slug')
  }
  if (!data) {
    return false
  }
  if (excludeId && data.id === excludeId) {
    return false
  }
  return true
}

async function allocateUniqueSlug(
  supabase: Db,
  table: 'posts' | 'content_entries',
  baseSlug: string,
  excludeId?: string,
): Promise<string> {
  const base = baseSlug.trim()
  if (!base) {
    throw new Error('Invalid slug')
  }
  const isTaken = (candidate: string) =>
    slugTakenOnTable(supabase, table, candidate, excludeId)

  if (!(await isTaken(base))) {
    return base
  }
  for (
    let suffix = 2;
    suffix <= SLUG_UNIQUENESS_MAX_SUFFIX_ATTEMPTS + 1;
    suffix += 1
  ) {
    const tail = `-${suffix}`
    const headMax = EDITOR_SLUG_MAX - tail.length
    if (headMax < 1) {
      break
    }
    const head = base.slice(0, headMax).replace(/-+$/, '')
    const candidate = `${head}${tail}`
    if (isValidEditorSlug(candidate) && !(await isTaken(candidate))) {
      return candidate
    }
  }
  throw new Error('Unable to allocate a unique slug')
}

export async function ensureUniquePostSlug(
  supabase: Db,
  baseSlug: string,
  excludeId?: string,
): Promise<string> {
  return allocateUniqueSlug(supabase, 'posts', baseSlug, excludeId)
}

export async function ensureUniqueContentSlug(
  supabase: Db,
  baseSlug: string,
  excludeId?: string,
): Promise<string> {
  return allocateUniqueSlug(supabase, 'content_entries', baseSlug, excludeId)
}
