import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AdminEditorSlugField({
  id,
  value,
  onChange,
  placeholder = 'page-slug',
}: {
  id: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div className="admin-editor-slug-field">
      <Label htmlFor={id}>Slug</Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="admin-input-tall mt-1 font-mono text-xs"
        autoComplete="off"
      />
    </div>
  )
}
