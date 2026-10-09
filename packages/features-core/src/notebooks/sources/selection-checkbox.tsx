"use client"

import { Checkbox, cn } from "@ihsp/ui"

type SelectionCheckboxProps = {
  checked: boolean
  /** Shows the dash of a partly selected group; takes precedence over `checked`. */
  indeterminate?: boolean
  disabled?: boolean
  "aria-label": string
  onCheckedChange: (checked: boolean) => void
  className?: string
}

/** A 44 px touch target around the checkbox of a source row, a group or "Select all". */
export function SelectionCheckbox({
  checked,
  indeterminate = false,
  disabled = false,
  "aria-label": label,
  onCheckedChange,
  className,
}: SelectionCheckboxProps) {
  return (
    <span className="flex size-11 shrink-0 items-center justify-center md:size-8">
      <Checkbox
        checked={checked}
        indeterminate={indeterminate}
        disabled={disabled}
        aria-label={label}
        onCheckedChange={(next) => onCheckedChange(next)}
        className={cn(
          "size-5 md:size-4",
          // The shared checkbox always draws a check mark: a dash marks a partly selected group.
          "data-indeterminate:border-primary data-indeterminate:bg-primary data-indeterminate:text-primary-foreground",
          "data-indeterminate:*:hidden data-indeterminate:before:h-0.5 data-indeterminate:before:w-2.5 data-indeterminate:before:rounded-full data-indeterminate:before:bg-current",
          className,
        )}
      />
    </span>
  )
}
