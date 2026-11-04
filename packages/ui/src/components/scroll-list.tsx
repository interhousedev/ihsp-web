import type { ReactNode } from "react"
import { cn } from "../lib/utils"

export type ScrollListProps = {
  /** Accessible name of the scroll region (required: a focusable scroller must be named). */
  label: string
  /** Any CSS length for the height cap. Default: 60% of the visible viewport height, at most 28 rem. */
  maxHeight?: string
  children: ReactNode
  className?: string
}

/**
 * A list that scrolls inside its own box instead of stretching the page: capped height, an internal scroll region that
 * is keyboard focusable (Tab, then the arrow keys and Page Up/Down) and named for assistive technology. Sized with
 * `dvh` so it respects the phone's dynamic toolbar; the cap never exceeds the viewport on short screens.
 */
export function ScrollList({ label, maxHeight, children, className }: ScrollListProps) {
  return (
    <div
      role="region"
      aria-label={label}
      // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable region must be focusable (WCAG 2.1.1)
      tabIndex={0}
      data-slot="scroll-list"
      style={maxHeight ? { maxHeight } : undefined}
      className={cn(
        "max-h-[min(60dvh,28rem)] overflow-y-auto overscroll-contain rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        className,
      )}
    >
      {children}
    </div>
  )
}
