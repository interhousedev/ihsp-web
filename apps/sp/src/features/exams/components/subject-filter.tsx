"use client"

import { useT } from "@ihsp/i18n"
import { Label, NativeSelect, NativeSelectOption } from "@ihsp/ui"
import { useId } from "react"

/** Keeps the controls of one subject; shown only when the list has more than one subject. */
export function SubjectFilter({
  subjects,
  value,
  onChange,
}: {
  subjects: { id: string; name: string }[]
  value: string | null
  onChange: (subjectId: string | null) => void
}) {
  const t = useT("exams.filter")
  const id = useId()
  if (subjects.length < 2) return null
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Label htmlFor={id}>{t("label")}</Label>
      <NativeSelect
        id={id}
        size="default"
        className="w-full max-w-xs [&_select]:h-11 md:[&_select]:h-8"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value === "" ? null : event.target.value)}
      >
        <NativeSelectOption value="">{t("all")}</NativeSelectOption>
        {subjects.map((subject) => (
          <NativeSelectOption key={subject.id} value={subject.id}>
            {subject.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  )
}
