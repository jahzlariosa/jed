import { describe, expect, it } from 'vitest'

import {
  addUserSubmitLabel,
  addUserSuccessMessage,
  buildCreateUserPayload,
  createEmptyAddUserForm,
} from './add-user-form'

describe('addUserSubmitLabel', () => {
  it('labels invite vs password create', () => {
    expect(addUserSubmitLabel(true)).toBe('Send invite')
    expect(addUserSubmitLabel(false)).toBe('Create user')
  })
})

describe('addUserSuccessMessage', () => {
  it('matches invite flow', () => {
    expect(addUserSuccessMessage(true)).toBe('Invite sent.')
    expect(addUserSuccessMessage(false)).toBe('User created.')
  })
})

describe('buildCreateUserPayload', () => {
  it('omits password when inviting', () => {
    expect(
      buildCreateUserPayload({
        ...createEmptyAddUserForm(),
        email: '  person@example.com ',
        displayName: '  Ada ',
        invite: true,
        password: 'secret123',
      }),
    ).toEqual({
      email: 'person@example.com',
      displayName: 'Ada',
      roleCode: 'member',
      password: undefined,
      invite: true,
    })
  })

  it('includes password when not inviting', () => {
    expect(
      buildCreateUserPayload({
        ...createEmptyAddUserForm(),
        email: 'person@example.com',
        invite: false,
        password: 'secret123',
      }).password,
    ).toBe('secret123')
  })
})
