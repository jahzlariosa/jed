export type AddUserFormValues = {
  email: string
  displayName: string
  roleCode: string
  password: string
  invite: boolean
}

export function createEmptyAddUserForm(): AddUserFormValues {
  return {
    email: '',
    displayName: '',
    roleCode: 'member',
    password: '',
    invite: true,
  }
}

export function addUserSubmitLabel(invite: boolean): string {
  return invite ? 'Send invite' : 'Create user'
}

export function addUserSuccessMessage(invite: boolean): string {
  return invite ? 'Invite sent.' : 'User created.'
}

export function buildCreateUserPayload(values: AddUserFormValues) {
  return {
    email: values.email.trim(),
    displayName: values.displayName.trim() || undefined,
    roleCode: values.roleCode,
    password: values.invite ? undefined : values.password,
    invite: values.invite,
  }
}
