"use client"

import { cn } from "@ihsp/ui"
import type { ComponentProps } from "react"

/**
 * The 16:9 box of one slide. It is a container-query container, so every size inside is written in `cqw` (1 % of the
 * slide width) and the same slide looks the same in a thumbnail, on the stage, full screen and on paper.
 */
export function SlideFrame({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "@container bg-card text-card-foreground relative aspect-video w-full overflow-hidden rounded-lg border shadow-xs",
        "[print-color-adjust:exact] print:rounded-none print:border-0 print:shadow-none",
        className,
      )}
      {...props}
    />
  )
}
