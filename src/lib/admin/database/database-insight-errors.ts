type RpcErrorLike = {
  code?: string
  message?: string
}

/** Client-safe message for a failed admin_database_* RPC (full page load). */
export function databaseInsightLoadError(error: RpcErrorLike): string {
  const code = error.code ?? ''
  const message = error.message ?? ''

  if (code === '42501' || /permission denied/i.test(message)) {
    return 'You do not have permission to load database insights.'
  }
  if (code === 'PGRST202' || /could not find the function/i.test(message)) {
    return 'Database insights are not available on this project.'
  }
  if (code === '42883' || /does not exist/i.test(message)) {
    return 'Database insights could not be loaded. Try again later.'
  }

  return 'Unable to load database insights.'
}

/** Client-safe message when only the activity RPC fails (other tabs still load). */
export function databaseActivityLoadError(error: RpcErrorLike): string {
  const code = error.code ?? ''
  const message = error.message ?? ''

  if (code === '42501' || /permission denied/i.test(message)) {
    return 'Activity stats are not available for this session.'
  }
  if (code === '42883' || /does not exist/i.test(message)) {
    return 'Activity stats could not be loaded. Try again later.'
  }

  return 'Activity stats are temporarily unavailable.'
}
