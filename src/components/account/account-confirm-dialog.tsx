import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function AccountConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  primaryLabel,
  onPrimary,
  primaryVariant = 'default',
  secondaryLabel,
  pending,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  primaryLabel: string
  onPrimary: () => void | Promise<void>
  primaryVariant?: 'default' | 'destructive'
  secondaryLabel: string
  pending?: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md"
        onEscapeKeyDown={(event) => {
          event.preventDefault()
          onOpenChange(false)
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            {secondaryLabel}
          </Button>
          <Button
            type="button"
            variant={primaryVariant}
            disabled={pending}
            onClick={() => void onPrimary()}
          >
            {primaryLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AccountCard({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: ReactNode
}) {
  return (
    <section id={id} className="account-card account-section-gap flex flex-col">
      <h2 className="text-[20px] font-semibold leading-tight tracking-tight">
        {title}
      </h2>
      {children}
    </section>
  )
}
