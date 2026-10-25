"use client"

import { Checkbox, cn } from "@ihsp/ui"
import { useId, type ReactNode } from "react"

type PickRowProps = {
  label: string
  /** Small grey text under the label (size, date, card count). */
  meta?: string
  /** Why the row cannot be ticked ("Already added", "No readable text"). */
  note?: string
  icon?: ReactNode
  checked: boolean
  disabled?: boolean
  onToggle: () => void
}

/** A tickable row of a picking tab: at least 44 px high, tapping anywhere on it ticks its checkbox. */
export function PickRow({ label, meta, note, icon, checked, disabled = false, onToggle }: PickRowProps) {
  const detailsId = useId()
  const details = [meta, note].filter(Boolean).join(" · ")
  return (
    <li
      className={cn(
        "relative flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2",
        disabled ? "bg-muted/40 text-muted-foreground" : "hover:bg-muted cursor-pointer",
        checked && !disabled && "border-primary/50 bg-primary/5",
      )}
    >
      {/* The checkbox's hit area is stretched over the whole row, so a tap anywhere ticks it. */}
      <Checkbox
        checked={checked}
        disabled={disabled}
        aria-label={label}
        aria-describedby={details ? detailsId : undefined}
        className="size-5 static after:inset-0"
        onCheckedChange={onToggle}
      />
      {icon}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{label}</span>
        {details ? (
          <span id={detailsId} className="text-muted-foreground truncate text-xs">
            {details}
          </span>
        ) : null}
      </span>
    </li>
  )
}
