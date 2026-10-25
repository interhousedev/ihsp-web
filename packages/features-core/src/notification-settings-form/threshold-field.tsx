"use client"

import { Input, Switch } from "@ihsp/ui"
import { useEffect, useId, useState } from "react"
import { parseThreshold } from "./settings-fields"

/**
 * "Off or a value" setting (BOT-12, BOT-13). The switch turns the alert on with `defaultValue` or off (`null`);
 * a typed value is saved when the field loses focus or Enter is pressed, and reverts when it is out of range.
 */
export function ThresholdField({
  label,
  value,
  defaultValue,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number | null
  defaultValue: number
  min: number
  max: number
  step: number
  onChange: (value: number | null) => void
}) {
  const labelId = useId()
  const [text, setText] = useState(value === null ? "" : String(value))

  useEffect(() => {
    setText(value === null ? "" : String(value))
  }, [value])

  function commit() {
    const parsed = parseThreshold(text, min, max)
    if (parsed === undefined) setText(value === null ? "" : String(value))
    else if (parsed !== value) onChange(parsed)
  }

  return (
    <div className="flex min-h-11 flex-wrap items-center justify-between gap-3">
      <p id={labelId} className="text-sm font-medium">
        {label}
      </p>
      <div className="flex items-center gap-3">
        {value !== null ? (
          <Input
            type="number"
            inputMode="decimal"
            min={min}
            max={max}
            step={step}
            value={text}
            aria-labelledby={labelId}
            className="h-11 w-24 md:h-8"
            onChange={(event) => setText(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === "Enter") commit()
            }}
          />
        ) : null}
        <Switch
          checked={value !== null}
          aria-labelledby={labelId}
          onCheckedChange={(on) => onChange(on ? defaultValue : null)}
        />
      </div>
    </div>
  )
}
