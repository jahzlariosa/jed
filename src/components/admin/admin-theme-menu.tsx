import { Monitor, Moon, Sun } from '@phosphor-icons/react'

import type { AdminThemePreference } from '#/lib/admin/admin-theme'
import { useAdminTheme } from '#/components/admin/use-admin-theme'
import { phosphorIcon } from '#/lib/icon'
import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

export function AdminThemeMenuItems() {
  const { preference, setPreference } = useAdminTheme()

  return (
    <>
      <DropdownMenuLabel>Appearance</DropdownMenuLabel>
      <DropdownMenuRadioGroup
        value={preference}
        onValueChange={(value) => setPreference(value as AdminThemePreference)}
      >
        <DropdownMenuRadioItem value="light">
          <Sun {...phosphorIcon} className="size-4 text-current" aria-hidden />
          Light
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="dark">
          <Moon {...phosphorIcon} className="size-4 text-current" aria-hidden />
          Dark
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="system">
          <Monitor
            {...phosphorIcon}
            className="size-4 text-current"
            aria-hidden
          />
          System
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
      <DropdownMenuSeparator />
    </>
  )
}
