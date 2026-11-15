"use client"

import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Icons } from "@ihsp/ui"
import { useEffect, useRef, useState, type ReactNode } from "react"

export type SectionMenuItem = { key: string; label: string }

/**
 * A big button that opens the list of the course's sections. The open section carries `aria-current`; choosing an item
 * calls `onSelect` with its key. The menu is the base-ui one of `@ihsp/ui`, so arrows, Home/End, Enter and Escape work.
 */
export function SectionMenu({
  children,
  items,
  active,
  onSelect,
}: {
  children: ReactNode
  items: readonly SectionMenuItem[]
  active: string
  onSelect: (key: string) => void
}) {
  const activeItem = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)
  // The menu opens with focus on its first item; move it to the open section so arrows start there.
  useEffect(() => {
    if (!open) return
    const frame = requestAnimationFrame(() => activeItem.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [open])
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            data-section-menu=""
            className="h-auto min-h-11 max-w-full min-w-0 justify-start gap-2 px-2 py-1.5 text-start text-lg font-semibold whitespace-normal md:text-xl"
          />
        }
      >
        <span className="min-w-0 break-words">{children}</span>
        <Icons.chevronDown aria-hidden className="size-5 shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 max-w-[calc(100vw-1rem)]">
        {items.map((item) => (
          <DropdownMenuItem
            key={item.key}
            ref={item.key === active ? activeItem : undefined}
            className="min-h-11 justify-between md:min-h-8"
            aria-current={item.key === active ? "page" : undefined}
            onClick={() => onSelect(item.key)}
          >
            {item.label}
            {item.key === active ? <Icons.check aria-hidden className="size-4" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
