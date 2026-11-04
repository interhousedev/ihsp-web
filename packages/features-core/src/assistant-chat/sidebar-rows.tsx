"use client"

import { cn, IconChevronDown, IconChevronRight } from "@ihsp/ui"
import { useEffect, useId, useState, type ReactNode } from "react"

/** One look for every row of the sidebar: same height, same radius, same focus ring. */
export const SIDEBAR_ROW =
  "hover:bg-muted focus-visible:ring-ring/50 flex min-h-11 w-full min-w-0 items-center gap-3 rounded-lg px-3 text-start text-sm outline-none focus-visible:ring-3 md:min-h-9"

/** The open destination is filled, never tinted. */
export const SIDEBAR_ROW_ACTIVE = "bg-muted font-medium"

/** A row under a project or a group: its text lines up with the labels of the rows above. */
export const SIDEBAR_SUB_ROW = "ps-11"

/** A fixed-width column for the icon of a sidebar row, so the labels line up whatever the icon. */
export function SidebarIcon({ children }: { children: ReactNode }) {
  return (
    <span data-sidebar-icon-column className="flex size-5 shrink-0 items-center justify-center">
      {children}
    </span>
  )
}

const HEADER = "text-muted-foreground flex min-h-9 items-center gap-1 px-3 text-xs font-medium md:min-h-7"

/** A section with a muted header. With `open` and `onToggle` the header collapses it; without them it always shows. */
export function SidebarSection({
  title,
  open = true,
  onToggle,
  children,
}: {
  title: string
  open?: boolean
  onToggle?: () => void
  children: ReactNode
}) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-0.5">
      <h3 id={headingId} className="m-0">
        {onToggle ? (
          <button
            type="button"
            aria-expanded={open}
            onClick={onToggle}
            className={cn(
              HEADER,
              "hover:text-foreground focus-visible:ring-ring/50 w-full rounded-lg outline-none focus-visible:ring-3",
            )}
          >
            {title}
            {open ? (
              <IconChevronDown className="size-3.5 shrink-0" aria-hidden />
            ) : (
              <IconChevronRight className="size-3.5 shrink-0" aria-hidden />
            )}
          </button>
        ) : (
          <span className={HEADER}>{title}</span>
        )}
      </h3>
      {open ? children : null}
    </section>
  )
}

function load(key: string): Record<string, boolean> {
  try {
    const raw = window.localStorage.getItem(key)
    const parsed: unknown = raw ? JSON.parse(raw) : null
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, boolean>) : {}
  } catch {
    return {}
  }
}

/** Remembered open and closed rows of a sidebar section (a private window just forgets them). */
export function useSidebarFlags(key: string) {
  const [flags, setFlags] = useState<Record<string, boolean>>({})
  useEffect(() => setFlags(load(key)), [key])

  function set(name: string, value: boolean) {
    const next = { ...load(key), [name]: value }
    setFlags(next)
    try {
      window.localStorage.setItem(key, JSON.stringify(next))
    } catch {
      // The state is just not remembered.
    }
  }

  return { flags, set }
}
