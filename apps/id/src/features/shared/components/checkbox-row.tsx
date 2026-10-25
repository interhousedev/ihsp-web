"use client"

import { Checkbox, Label } from "@ihsp/ui"
import { useId, type ReactNode } from "react"

type CheckboxRowProps = {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  /** The accessible name of the checkbox (the row text may hold more than a name). */
  ariaLabel: string
  disabled?: boolean
  children: ReactNode
}

/** A bordered row with a checkbox and its text; the whole row is the touch target (at least 44 px tall). */
export function CheckboxRow({ checked, onCheckedChange, ariaLabel, disabled, children }: CheckboxRowProps) {
  const id = useId()
  return (
    <div className="flex min-h-11 items-start gap-3 rounded-lg border p-3">
      <Checkbox
        id={id}
        aria-label={ariaLabel}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        className="mt-0.5"
      />
      <Label htmlFor={id} className="grid min-w-0 flex-1 cursor-pointer gap-1 font-normal">
        {children}
      </Label>
    </div>
  )
}
