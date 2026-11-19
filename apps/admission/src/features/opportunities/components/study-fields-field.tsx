"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { useState } from "react"
import { StudyFieldSheet } from "../../chooser/components/study-field-select"
import { useStudyFields } from "../../chooser/hooks"
import { chosenStudyFields } from "../../profile/study-fields"

/** The API keeps at most this many fields of study per entry. */
export const MAX_STUDY_FIELDS = 8

/** Removable chips of the chosen fields of study and the chooser's grouped, searchable sheet to add more. */
export function StudyFieldsField({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  const t = useT("opportunities")
  const [open, setOpen] = useState(false)
  const { groups } = useStudyFields()

  function toggle(id: string) {
    if (value.includes(id)) onChange(value.filter((v) => v !== id))
    else if (value.length < MAX_STUDY_FIELDS) onChange([...value, id])
  }

  return (
    <fieldset className="flex flex-col gap-2 text-sm">
      <legend>{t("studyFieldsLabel")}</legend>
      <ul className="flex flex-wrap gap-1">
        {chosenStudyFields(groups, value).map((field) => (
          <li key={field.id}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              aria-label={t("studyFieldRemove", { field: field.label })}
              onClick={() => toggle(field.id)}
            >
              {field.label}
              <Icons.close aria-hidden />
            </Button>
          </li>
        ))}
      </ul>
      <StudyFieldSheet
        open={open}
        onOpenChange={setOpen}
        groups={groups}
        chosen={value}
        onToggle={toggle}
        trigger={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            disabled={value.length >= MAX_STUDY_FIELDS}
          >
            <Icons.add aria-hidden />
            {t("studyFieldsAdd")}
          </Button>
        }
      />
    </fieldset>
  )
}
