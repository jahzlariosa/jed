import { useEffect, useState } from 'react'

export function AdminAutosaveStatus({
  dirty,
  saving,
  savedAt,
}: {
  dirty: boolean
  saving: boolean
  savedAt?: number | null
}) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (dirty || saving) {
      return
    }
    const id = window.setInterval(() => setNow(Date.now()), 15_000)
    return () => window.clearInterval(id)
  }, [dirty, saving])

  let label = 'Saved'
  if (saving) {
    label = 'Saving…'
  } else if (dirty) {
    label = 'Unsaved changes'
  } else if (savedAt) {
    const seconds = Math.max(1, Math.round((now - savedAt) / 1000))
    label = seconds < 60 ? `Saved ${seconds}s ago` : 'Saved'
  }

  return (
    <span className="admin-autosave" role="status">
      {!dirty && !saving ? (
        <span className="admin-autosave-pulse" aria-hidden />
      ) : null}
      {label}
    </span>
  )
}
