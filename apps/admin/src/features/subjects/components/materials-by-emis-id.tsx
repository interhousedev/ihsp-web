"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, Input } from "@ihsp/ui"
import { useId, useState } from "react"
import { LabeledField } from "../../shared/components/labeled-field"
import { TOUCH } from "../../shared/utils/touch"

/** The largest EMIS subject id the backend stores (a 32-bit integer). */
const MAX_EMIS_ID = 2_147_483_647

/** "Materials by EMIS ID": opens the default materials of an id that is not in the subjects list yet. */
export function MaterialsByEmisId({ onOpen }: { onOpen: (eduSubjectId: number, label?: string) => void }) {
  const t = useT("subjects.materials.byId")
  const ids = useId()
  const [rawId, setRawId] = useState("")
  const [label, setLabel] = useState("")
  const eduSubjectId = Number(rawId)
  const valid =
    rawId.trim() !== "" && Number.isInteger(eduSubjectId) && eduSubjectId >= 1 && eduSubjectId <= MAX_EMIS_ID

  return (
    <form
      aria-labelledby={`${ids}-heading`}
      className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:flex-wrap sm:items-end"
      onSubmit={(event) => {
        event.preventDefault()
        if (valid) onOpen(eduSubjectId, label.trim() || undefined)
      }}
    >
      <div className="flex flex-col gap-0.5 sm:basis-full">
        <h2 id={`${ids}-heading`} className="text-sm font-medium">
          {t("heading")}
        </h2>
        <p className="text-muted-foreground text-xs">{t("hint")}</p>
      </div>
      <LabeledField label={t("id")} htmlFor={`${ids}-id`} className="sm:w-48">
        <Input
          id={`${ids}-id`}
          type="number"
          inputMode="numeric"
          min={1}
          max={MAX_EMIS_ID}
          step={1}
          value={rawId}
          className={TOUCH}
          onChange={(event) => setRawId(event.target.value)}
        />
      </LabeledField>
      <LabeledField label={t("label")} htmlFor={`${ids}-label`} className="sm:w-64">
        <Input
          id={`${ids}-label`}
          value={label}
          maxLength={120}
          className={TOUCH}
          onChange={(event) => setLabel(event.target.value)}
        />
      </LabeledField>
      <Button type="submit" variant="outline" className={TOUCH} disabled={!valid}>
        <Icons.paperclip aria-hidden />
        {t("open")}
      </Button>
    </form>
  )
}
