"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconButton,
  IconDots,
} from "@ihsp/ui"
import type { ComponentProps } from "react"

export type OverflowItem = {
  key: string
  label: string
  icon: ComponentProps<typeof IconButton>["icon"]
  onSelect: () => void
  disabled?: boolean
}

type OverflowMenuProps = {
  /** Names the "⋯" button and is its tooltip. */
  label: string
  items: readonly OverflowItem[]
}

/** The "⋯" button of a viewer toolbar: the secondary actions, so the bar itself stays one row. */
export function OverflowMenu({ label, items }: OverflowMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<IconButton icon={IconDots} aria-label={label} className="size-11 md:size-8" />} />
      <DropdownMenuContent align="end" className="w-56">
        {items.map(({ key, label: text, icon: Icon, onSelect, disabled }) => (
          <DropdownMenuItem key={key} className="min-h-11 gap-2 md:min-h-8" disabled={disabled} onClick={onSelect}>
            <Icon aria-hidden />
            {text}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
