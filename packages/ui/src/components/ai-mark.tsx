"use client"

import { cn } from "../lib/utils"
import { Icons } from "./icons"

/** A small AI icon for content made by an AI client; `label` is what assistive technology and the tooltip say. */
export function AiMark({ label, className }: { label: string; className?: string }) {
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn("text-muted-foreground inline-flex shrink-0 items-center", className)}
    >
      <Icons.assistant className="size-4" aria-hidden />
    </span>
  )
}
