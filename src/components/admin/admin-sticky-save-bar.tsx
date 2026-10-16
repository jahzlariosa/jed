import { Button } from '@/components/ui/button'

export function AdminStickySaveBar({
  dirty,
  saving,
  onDiscard,
  onSave,
  saveLabel = 'Save changes',
}: {
  dirty: boolean
  saving: boolean
  onDiscard?: () => void
  onSave: () => void
  saveLabel?: string
}) {
  return (
    <div className="admin-save-bar" role="status" aria-live="polite">
      <div
        className={
          dirty
            ? 'admin-save-bar-status admin-save-bar-status-dirty'
            : 'admin-save-bar-status'
        }
      >
        {dirty ? (
          <>
            <span className="admin-save-bar-dot" aria-hidden />
            Unsaved changes
          </>
        ) : (
          'All changes saved'
        )}
      </div>
      <div className="admin-save-bar-actions">
        {dirty && onDiscard ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={saving}
            onClick={onDiscard}
          >
            Discard
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          loading={saving}
          disabled={saving || !dirty}
          onClick={onSave}
        >
          {saveLabel}
        </Button>
      </div>
    </div>
  )
}
