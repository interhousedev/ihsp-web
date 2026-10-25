"use client"

import { cn } from "@ihsp/ui"
import { type FocusEvent, type KeyboardEvent, type ReactNode, useLayoutEffect, useRef, useState } from "react"

/**
 * A WAI-ARIA toolbar: one Tab stop, arrow keys (and Home / End) move between its buttons, Escape calls `onEscape`
 * (back to the text). Buttons mark themselves with `data-toolbar-item`.
 */
export function EditorToolbar({
  label,
  onEscape,
  className,
  children,
}: {
  label: string
  onEscape?: () => void
  className?: string
  children: ReactNode
}) {
  const root = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  const items = () =>
    Array.from(root.current?.querySelectorAll<HTMLElement>("[data-toolbar-item]:not(:disabled)") ?? [])

  useLayoutEffect(() => {
    const all = items()
    const current = Math.min(active, all.length - 1)
    all.forEach((item, index) => {
      item.tabIndex = index === current ? 0 : -1
    })
  })

  function move(event: KeyboardEvent<HTMLDivElement>) {
    const all = items()
    const index = all.findIndex((item) => item === document.activeElement)
    const last = all.length - 1
    const next =
      event.key === "ArrowRight"
        ? (index + 1) % all.length
        : event.key === "ArrowLeft"
          ? (index - 1 + all.length) % all.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null
    if (event.key === "Escape" && onEscape) {
      event.preventDefault()
      onEscape()
      return
    }
    if (next === null || index === -1) return
    event.preventDefault()
    setActive(next)
    all[next]?.focus()
  }

  function remember(event: FocusEvent<HTMLDivElement>) {
    const index = items().indexOf(event.target as HTMLElement)
    if (index !== -1) setActive(index)
  }

  return (
    <div
      ref={root}
      role="toolbar"
      tabIndex={-1}
      aria-label={label}
      aria-orientation="horizontal"
      onKeyDown={move}
      onFocus={remember}
      className={cn("flex items-center gap-0.5", className)}
    >
      {children}
    </div>
  )
}
