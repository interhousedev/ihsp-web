"use client"

import { useT } from "@ihsp/i18n"
import { Button, Input, Label } from "@ihsp/ui"
import { IconPlus, IconX } from "@ihsp/ui"
import { useId, useState } from "react"

/** A list of short texts (authors, translators): type a name, press Enter or Add; each entry has a remove button. */
export function StringListField({
  label,
  values,
  onChange,
  required = false,
  error,
}: {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  required?: boolean
  error?: string
}) {
  const t = useT("library.manage.editor")
  const id = useId()
  const [draft, setDraft] = useState("")

  function add() {
    const value = draft.trim()
    if (!value || values.includes(value)) {
      setDraft("")
      return
    }
    onChange([...values, value])
    setDraft("")
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? <span aria-hidden> *</span> : null}
      </Label>
      {values.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5" aria-label={label}>
          {values.map((value) => (
            <li
              key={value}
              className="bg-secondary text-secondary-foreground flex items-center gap-1 rounded-full py-0.5 ps-3 pe-1 text-sm"
            >
              {value}
              <button
                type="button"
                className="hover:bg-background/60 focus-visible:ring-ring flex size-8 items-center justify-center rounded-full outline-none focus-visible:ring-2"
                aria-label={t("removeEntry", { name: value })}
                onClick={() => onChange(values.filter((item) => item !== value))}
              >
                <IconX className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex gap-2">
        <Input
          id={id}
          value={draft}
          aria-invalid={!!error}
          aria-required={required}
          className="min-h-11 md:min-h-8"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              add()
            }
          }}
        />
        <Button type="button" variant="outline" className="min-h-11 md:min-h-8" onClick={add}>
          <IconPlus aria-hidden />
          {t("addEntry")}
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
    </div>
  )
}
