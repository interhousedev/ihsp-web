"use client"

import { cn, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@ihsp/ui"
import type { ReactNode } from "react"

/** A centred pop-up over the ledger (a near-full-height one on a phone). */
export function LedgerSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("flex flex-col gap-0 overflow-hidden p-0 sm:max-w-xl", className)}>
        <DialogHeader className="border-hairline border-b p-4 pr-14">
          <DialogTitle className="truncate text-lg font-semibold">{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">{children}</div>
      </DialogContent>
    </Dialog>
  )
}
