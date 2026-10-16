import { describe, expect, it, vi } from 'vitest'

import { writeAuditLog } from '#/lib/cms/audit.server'

describe('writeAuditLog', () => {
  it('inserts with the acting user id on the session client', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null })
    const from = vi.fn().mockReturnValue({ insert })
    const supabase = { from }

    const result = await writeAuditLog(
      supabase as unknown as Parameters<typeof writeAuditLog>[0],
      {
        actorUserId: 'actor-1',
        action: 'user.role',
        targetType: 'user',
        targetId: 'user-2',
        metadata: { role: 'member' },
      },
    )

    expect(result).toEqual({ ok: true })
    expect(from).toHaveBeenCalledWith('audit_log')
    expect(insert).toHaveBeenCalledWith({
      actor_user_id: 'actor-1',
      action: 'user.role',
      target_type: 'user',
      target_id: 'user-2',
      metadata: { role: 'member' },
    })
  })

  it('logs insert failures instead of hiding them', async () => {
    const error = {
      message: 'new row violates row-level security',
      code: '42501',
    }
    const insert = vi.fn().mockResolvedValue({ error })
    const supabase = { from: vi.fn().mockReturnValue({ insert }) }
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await writeAuditLog(
      supabase as unknown as Parameters<typeof writeAuditLog>[0],
      {
        actorUserId: 'actor-1',
        action: 'user.create',
        targetType: 'user',
        targetId: 'user-2',
      },
    )

    expect(result).toEqual({ error: error.message })
    expect(spy).toHaveBeenCalledWith(
      'audit_log insert failed',
      expect.objectContaining({
        action: 'user.create',
        message: error.message,
        code: error.code,
      }),
    )
    spy.mockRestore()
  })
})
