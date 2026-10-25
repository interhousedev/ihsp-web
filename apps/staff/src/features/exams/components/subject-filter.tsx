"use client"

import { useT } from "@ihsp/i18n"
import { Dropdown } from "@ihsp/ui"
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
      <Dropdown
        id={id}
        className="w-full sm:w-60"
        value={value}
        onValueChange={onChange}
        options={[
          { value: "", label: t("allSubjects") },
          ...subjects.map((subject) => ({ value: subject.id, label: subject.name })),
        ]}
      />
    </div>
  )
}
