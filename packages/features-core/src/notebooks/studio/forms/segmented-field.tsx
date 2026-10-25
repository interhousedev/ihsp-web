"use client"

import { ToggleGroup, ToggleGroupItem } from "@ihsp/ui"
import { useId } from "react"

export type SegmentedOption<V extends string> = { value: V; label: string }

export type SegmentedFieldProps<V extends string> = {
  label: string
  value: V
  options: readonly SegmentedOption<V>[]
  onChange: (value: V) => void
}

/** A labelled single-choice row of buttons ("Fewer / Standard / More"); the chosen one cannot be switched off. */
export function SegmentedField<V extends string>({ label, value, options, onChange }: SegmentedFieldProps<V>) {
  const labelId = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <span id={labelId} className="text-sm font-medium">
        {label}
      </span>
      <ToggleGroup
        value={[value]}
        variant="outline"
        spacing={1}
        aria-labelledby={labelId}
        className="w-full flex-wrap"
        onValueChange={(next) => {
          const chosen = options.find((option) => option.value === next[0])
          if (chosen) onChange(chosen.value)
        }}
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            className="aria-pressed:border-primary aria-pressed:bg-primary/10 min-h-11 flex-1 px-3 aria-pressed:font-semibold md:min-h-8"
          >
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
