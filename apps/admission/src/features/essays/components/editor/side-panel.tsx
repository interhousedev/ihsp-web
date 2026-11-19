"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, Sheet, SheetContent, SheetHeader, SheetTitle } from "@ihsp/ui"
import type { ReactNode } from "react"
import { useWide } from "./use-wide"

export type SidePanelProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  side: "left" | "right"
  children: ReactNode
  className?: string
}

/** Beside the paper on desktop (`aside`), a sheet below it. */
export function SidePanel({ open, onOpenChange, title, side, children, className }: SidePanelProps) {
  const t = useT("essays")
  const wide = useWide()
  if (wide) {
    if (!open) return null
    return (
      <aside aria-label={title} className={className}>
        {side === "right" ? (
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-medium">{title}</h2>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label={t("editor.close")}
              onClick={() => onOpenChange(false)}
            >
              <Icons.close aria-hidden />
            </Button>
          </div>
        ) : null}
        {children}
      </aside>
    )
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={side} className="w-[min(100vw,24rem)] overflow-y-auto p-4 sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  )
}
