import { FieldHelpPopover } from '#/components/admin/field-help-popover'
import {
  SETTINGS_FIELD_HELP,
  type SettingsFieldHelpKey,
} from '#/lib/admin/settings-help'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function AdminFieldLabel({
  label,
  helpKey,
  htmlFor,
  className,
}: {
  label: string
  helpKey: SettingsFieldHelpKey
  htmlFor?: string
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      <FieldHelpPopover
        fieldLabel={label}
        helpText={SETTINGS_FIELD_HELP[helpKey]}
      />
    </div>
  )
}
