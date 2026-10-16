export function adminPasswordResetErrorMessage(error: {
  message: string
  status?: number | null
  code?: string | null
}): string {
  const message = error.message.toLowerCase()
  const status = error.status ?? 0

  console.error('admin password reset email failed', {
    status: error.status,
    code: error.code,
    message: error.message,
  })

  if (
    message.includes('redirect') ||
    message.includes('allowlist') ||
    message.includes('redirect_to')
  ) {
    return 'Reset link blocked: add your APP_URL auth callback to the Supabase redirect allow list.'
  }

  if (status === 429 || message.includes('rate limit')) {
    return 'Too many reset emails. Wait a few minutes and try again.'
  }

  if (message.includes('email') && message.includes('invalid')) {
    return 'That email address is not valid for password reset.'
  }

  return 'Unable to send reset email. Check server logs for details.'
}
