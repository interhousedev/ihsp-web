"use client"

import { cn, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@ihsp/ui"
import type { ReactNode } from "react"
import { useWide } from "../components/editor/use-wide"

/** A panel over the ledger: from the right on a desktop, from the bottom on a phone. */
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
  const wide = useWide()
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={wide ? "right" : "bottom"}
        className={cn(
          "gap-0 overflow-hidden",
          wide ? "w-[min(100vw,34rem)] sm:max-w-none" : "max-h-[88dvh]",
          className,
        )}
      >
        <SheetHeader className="border-hairline border-b pr-14">
          <SheetTitle className="truncate text-lg font-semibold">{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">{children}</div>
      </SheetContent>
    </Sheet>
  )
}
