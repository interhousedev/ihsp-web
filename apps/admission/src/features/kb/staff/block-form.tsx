"use client"

import { useT } from "@ihsp/i18n"
import { Button, Input, Textarea } from "@ihsp/ui"
import { useState } from "react"
import {
  BLOCK_FIELDS,
  MAX_STRING,
  buildSource,
  validateBlock,
  type BlockKind,
  type BlockValues,
  type FieldError,
} from "../openui-source"

const DEFAULTS: BlockValues = { tone: "info", url: "https://" }

/** The fields of one block kind; submitting regenerates the OpenUI source. A div, not a form: it sits in a form. */
export function BlockForm({
  kind,
  initial,
  onSubmit,
  onCancel,
}: {
  kind: BlockKind
  initial?: BlockValues
  onSubmit: (source: string) => void
  onCancel: () => void
}) {
  const t = useT("kb.staff.block")
  const [values, setValues] = useState<BlockValues>({ ...DEFAULTS, ...initial })
  const [error, setError] = useState<FieldError | null>(null)
  const set = (key: keyof BlockValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }))
    setError(null)
  }

  function apply() {
    const wrong = validateBlock(kind, values)
    if (wrong) setError(wrong)
    else onSubmit(buildSource(kind, values))
  }

  return (
    <div className="bg-muted/30 flex flex-col gap-3 rounded-md border p-3" role="group" aria-label={t(`kind.${kind}`)}>
      {BLOCK_FIELDS[kind].map((key) => {
        const invalid = error === key
        const label = t(`field.${key}`)
        return (
          <label key={key} className="flex flex-col gap-1 text-sm font-medium">
            {label}
            {key === "tone" ? (
              <select
                value={values.tone}
                onChange={(event) => set("tone", event.target.value)}
                className="border-input bg-background h-10 rounded-md border px-3 text-sm"
              >
                <option value="info">{t("tone.info")}</option>
                <option value="warning">{t("tone.warning")}</option>
              </select>
            ) : key === "steps" ? (
              <Textarea
                rows={4}
                value={values.steps ?? ""}
                aria-invalid={invalid}
                onChange={(event) => set("steps", event.target.value)}
              />
            ) : (
              <Input
                value={values[key] ?? ""}
                maxLength={MAX_STRING}
                inputMode={key === "url" ? "url" : undefined}
                aria-invalid={invalid}
                onChange={(event) => set(key, event.target.value)}
              />
            )}
            {invalid ? (
              <span role="alert" className="text-destructive text-xs font-normal">
                {t(`invalid.${key}`)}
              </span>
            ) : null}
          </label>
        )
      })}
      {error === "source" ? (
        <p role="alert" className="text-destructive text-xs">
          {t("invalid.source")}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          {t("cancel")}
        </Button>
        <Button type="button" size="sm" onClick={apply}>
          {t("apply")}
        </Button>
      </div>
    </div>
  )
}
