"use client"

import { useId } from "react"
import { cn } from "../lib/utils"
import { Dropdown } from "./ui/dropdown"
import { Label } from "./ui/label"

/** All subjects or one. Nothing to choose with fewer than two subjects, so it then renders nothing. */
export function SubjectFilter({
  subjects,
  value,
  onChange,
  label,
  allLabel,
  className,
}: {
  subjects: readonly { id: string; name: string }[]
  value: string | null
  onChange: (subjectId: string | null) => void
  label: string
  allLabel: string
  className?: string
}) {
  const id = useId()
  if (subjects.length < 2) return null
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Dropdown
        id={id}
        className="w-full sm:w-60 [&_button]:min-h-11 md:[&_button]:min-h-8"
        value={value ?? ""}
        onValueChange={(next) => onChange(next === "" ? null : next)}
        options={[
          { value: "", label: allLabel },
          ...subjects.map((subject) => ({ value: subject.id, label: subject.name })),
        ]}
      />
    </div>
  )
}
