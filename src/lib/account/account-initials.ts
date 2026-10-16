export function profileInitials(input: {
  displayName: string | null
  email: string | null
}) {
  const name = input.displayName?.trim()
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }
  const email = input.email?.trim() ?? ''
  if (!email) {
    return '??'
  }
  const local = email.split('@')[0] ?? ''
  const parts = local.split(/[._-]+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
  }
  return local.slice(0, 2).toUpperCase()
}

export function profileDisplayLabel(input: {
  displayName: string | null
  email: string | null
}) {
  const name = input.displayName?.trim()
  if (name) {
    return name
  }
  const email = input.email?.trim()
  return email && email.length > 0 ? email : 'Member'
}
