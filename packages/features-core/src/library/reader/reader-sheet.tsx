"use client"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, cn, useIsMobile } from "@ihsp/ui"
import type { ReactNode } from "react"

/**
 * A panel of the reader: slides in from the side on wide screens and from the bottom on phones, where it is at most
 * 85% of the height so the page stays visible above it. Closes with Esc and with the close button.
 */
export function ReaderSheet({
  open,
  onOpenChange,
  title,
  description,
  side,
  children,
  className,
}: {
  open: boolean
  onOpenChange(open: boolean): void
  title: string
  description?: string
  /** The side on wide screens; phones always get the bottom. */
  side?: "left" | "right"
  children: ReactNode
  className?: string
}) {
  const mobile = useIsMobile()
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={mobile ? "bottom" : (side ?? "right")}
        className={cn("gap-0 p-0", mobile ? "max-h-[85dvh] rounded-t-xl" : "w-full sm:max-w-sm", className)}
      >
        <SheetHeader className="border-b pe-12">
          <SheetTitle>{title}</SheetTitle>
          {description ? (
            <SheetDescription>{description}</SheetDescription>
          ) : (
            <SheetDescription className="sr-only">{title}</SheetDescription>
          )}
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  )
}
