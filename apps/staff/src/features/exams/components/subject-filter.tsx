"use client"

import { useT } from "@ihsp/i18n"
import { NativeSelect } from "@ihsp/ui"
import { useId } from "react"

/** The subject view of the list: all subjects or one (`?subject=`). */
export function SubjectFilter({
  subjects,
  value,
  onChange,
}: {
  subjects: readonly { id: string; name: string }[]
  value: string
  onChange: (subjectId: string) => void
}) {
  const t = useT("exams")
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {t("subjectFilter")}
      </label>
      <NativeSelect
        id={id}
        className="w-full sm:w-60 [&_select]:h-11 md:[&_select]:h-8"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{t("allSubjects")}</option>
        {subjects.map((subject) => (
          <option key={subject.id} value={subject.id}>
            {subject.name}
          </option>
        ))}
      </NativeSelect>
    </div>
  )
}
