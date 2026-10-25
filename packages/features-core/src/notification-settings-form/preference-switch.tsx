"use client"

import { Switch } from "@ihsp/ui"
import { useId } from "react"

/** A labelled on/off setting row with a 44 px touch target. */
export function PreferenceSwitch({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}) {
  const labelId = useId()
  return (
    <div className="flex min-h-11 items-center justify-between gap-3">
      <div className="min-w-0">
        <p id={labelId} className="text-sm font-medium">
          {label}
        </p>
        {description ? <p className="text-muted-foreground text-xs">{description}</p> : null}
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        aria-labelledby={labelId}
        onCheckedChange={(value) => onCheckedChange(value)}
      />
    </div>
  )
}
