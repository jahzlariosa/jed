type PgError = {
  code?: string
  message?: string
  details?: string | null
}

export function logPostSaveFailure(phase: 'insert' | 'update', error: PgError) {
  console.error(
    `saveAdminPostFn ${phase} failed`,
    error.code ?? 'unknown',
    error.message ?? 'unknown',
    error.details ?? '',
  )
}

export function clientPostSaveError(
  phase: 'insert' | 'update',
  error: PgError,
): string {
  logPostSaveFailure(phase, error)
  if (error.code === '23505') {
    return 'That slug is already in use. Choose a different slug.'
  }
  if (error.code === '23514') {
    return 'Check the slug: use lowercase letters, numbers, and hyphens only.'
  }
  if (error.code === '42501') {
    return 'You do not have permission to save posts.'
  }
  if (phase === 'insert') {
    return 'Unable to create post. Check the slug and required fields, then try again.'
  }
  return 'Unable to save post. Try again.'
}
