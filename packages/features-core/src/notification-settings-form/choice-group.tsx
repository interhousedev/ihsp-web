"use client"

import { Checkbox } from "@ihsp/ui"

export type Choice<T extends string | number> = { value: T; label: string }

/** A set of checkboxes in a fieldset (mark types, mark values, subjects). Each row is at least 44 px high. */
export function ChoiceGroup<T extends string | number>({
  legend,
  choices,
  selected,
  onToggle,
  disabled,
}: {
  legend: string
  choices: readonly Choice<T>[]
  selected: readonly T[]
  onToggle: (value: T) => void
  disabled?: boolean
}) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-1" disabled={disabled}>
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-x-4">
        {choices.map((choice) => (
          <label key={String(choice.value)} className="flex min-h-11 items-center gap-2 text-sm">
            {/* No aria-label: the wrapping <label> names the checkbox (both together would read the name twice). */}
            <Checkbox checked={selected.includes(choice.value)} onCheckedChange={() => onToggle(choice.value)} />
            <span>{choice.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
