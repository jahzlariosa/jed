import { createServerFn } from '@tanstack/react-start'

import { PERMISSIONS } from '#/auth'
import { requireCmsAccess, requireCmsWrite } from '#/auth/admin-access.server'
import { markPrivateNoStore } from '#/auth/session.server'
import { escapeLike, quotePostgrestFilterValue } from '#/auth/validators'
import {
  parseContactInboxQuery,
  parseContactStatusUpdate,
} from '#/lib/admin/contact-inbox-query'
import { writeAuditLog } from '#/lib/cms/audit.server'
import type { Tables } from '#/lib/supabase/database.types'

export type ContactMessageRow = Pick<
  Tables<'contact_messages'>,
  'id' | 'name' | 'email' | 'message' | 'status' | 'created_at'
>

const COLUMNS = 'id, name, email, message, status, created_at'

export const listContactMessagesFn = createServerFn({ method: 'GET' })
  .validator(parseContactInboxQuery)
  .handler(async ({ data }) => {
    markPrivateNoStore()
    const { supabase } = await requireCmsAccess(PERMISSIONS.adminAccess)
    const offset = (data.page - 1) * data.pageSize
    let query = supabase
      .from('contact_messages')
      .select(COLUMNS, { count: 'exact' })
      .order('created_at', { ascending: false })
    if (data.status === 'inbox') {
      query = query.neq('status', 'archived')
    } else if (data.status === 'unread') {
      query = query.eq('status', 'new')
    } else {
      query = query.eq('status', 'archived')
    }
    if (data.q) {
      const pattern = quotePostgrestFilterValue(`%${escapeLike(data.q)}%`)
      query = query.or(
        `name.ilike.${pattern},email.ilike.${pattern},message.ilike.${pattern}`,
      )
    }
    const head = { count: 'exact' as const, head: true }
    const [list, inbox, unread, archived] = await Promise.all([
      query.range(offset, offset + data.pageSize - 1),
      supabase
        .from('contact_messages')
        .select('id', head)
        .neq('status', 'archived'),
      supabase.from('contact_messages').select('id', head).eq('status', 'new'),
      supabase
        .from('contact_messages')
        .select('id', head)
        .eq('status', 'archived'),
    ])
    if (list.error) {
      console.error('contact inbox load failed', { code: list.error.code })
      throw new Error('Unable to load messages')
    }
    const items = (list.data ?? []) as ContactMessageRow[]
    let selected: ContactMessageRow | null = null
    let selectedMissing = false
    if (data.id) {
      selected = items.find((row) => row.id === data.id) ?? null
      if (!selected) {
        const { data: row } = await supabase
          .from('contact_messages')
          .select(COLUMNS)
          .eq('id', data.id)
          .maybeSingle()
        selected = (row as ContactMessageRow | null) ?? null
        selectedMissing = !selected
      }
    }
    const total = list.count ?? 0
    return {
      items,
      total,
      page: data.page,
      pageSize: data.pageSize,
      pageCount: Math.max(1, Math.ceil(total / data.pageSize)),
      counts: {
        inbox: inbox.count ?? 0,
        unread: unread.count ?? 0,
        archived: archived.count ?? 0,
      },
      selected,
      selectedMissing,
    }
  })

export type ContactInboxPage = Awaited<ReturnType<typeof listContactMessagesFn>>

export const updateContactMessageStatusFn = createServerFn({ method: 'POST' })
  .validator(parseContactStatusUpdate)
  .handler(async ({ data }) => {
    markPrivateNoStore()
    const { user, supabase } = await requireCmsWrite(PERMISSIONS.adminAccess)
    const { data: row, error } = await supabase
      .from('contact_messages')
      .update({ status: data.status })
      .eq('id', data.id)
      .select('id, status')
      .maybeSingle()
    if (error || !row) {
      console.error('contact status update failed', { code: error?.code })
      return { error: 'Unable to update message' }
    }
    await writeAuditLog(supabase, {
      actorUserId: user.id,
      action: 'contact_message.status',
      targetType: 'contact_message',
      targetId: row.id,
      metadata: { status: row.status },
    })
    return { ok: true as const, status: row.status }
  })
