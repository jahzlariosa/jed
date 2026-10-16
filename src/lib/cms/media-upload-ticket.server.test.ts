import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  mintUploadTicket,
  verifyUploadTicket,
} from '#/lib/cms/media-upload-ticket.server'

const TEST_SECRET = 'local-media-upload-ticket-secret-32b'

describe('media upload ticket', () => {
  const prev = process.env.MEDIA_UPLOAD_TICKET_SECRET

  beforeEach(() => {
    process.env.MEDIA_UPLOAD_TICKET_SECRET = TEST_SECRET
  })

  afterEach(() => {
    process.env.MEDIA_UPLOAD_TICKET_SECRET = prev
  })

  it('round-trips claims for the same user', () => {
    const ticket = mintUploadTicket({
      userId: 'user-1',
      storagePath: '123-photo.png',
      mimeType: 'image/png',
      byteSize: 1200,
      now: 1_700_000_000_000,
    })
    const claims = verifyUploadTicket(ticket, 'user-1', 1_700_000_000_000)
    expect(claims).toMatchObject({
      storagePath: '123-photo.png',
      mimeType: 'image/png',
      byteSize: 1200,
    })
  })

  it('rejects tickets for a different user', () => {
    const ticket = mintUploadTicket({
      userId: 'user-1',
      storagePath: '123-photo.png',
      mimeType: 'image/png',
      byteSize: 1200,
      now: 1_700_000_000_000,
    })
    expect(verifyUploadTicket(ticket, 'user-2', 1_700_000_000_000)).toBeNull()
  })

  it('rejects expired tickets', () => {
    const ticket = mintUploadTicket({
      userId: 'user-1',
      storagePath: '123-photo.png',
      mimeType: 'image/png',
      byteSize: 1200,
      now: 1_700_000_000_000,
    })
    expect(
      verifyUploadTicket(ticket, 'user-1', 1_700_000_000_000 + 16 * 60 * 1000),
    ).toBeNull()
  })
})
