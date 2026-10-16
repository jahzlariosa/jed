import { Info } from '@phosphor-icons/react'
import { phosphorIcon } from '#/lib/icon'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export function FieldHelpPopover({
  fieldLabel,
  helpText,
}: {
  fieldLabel: string
  helpText: string
}) {
  const triggerLabel = `More about ${fieldLabel}`

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label={triggerLabel}
        >
          <Info
            className="size-4"
            weight="regular"
            aria-hidden
            {...phosphorIcon}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <p className="text-sm leading-relaxed text-popover-foreground">
          {helpText}
        </p>
      </PopoverContent>
    </Popover>
  )
}
