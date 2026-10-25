"use client"

import { useT } from "@ihsp/i18n"
import { Label, Switch } from "@ihsp/ui"
import { useId } from "react"
import type { BookForm } from "./book-form"

/** Who can see the book and whether it can be downloaded. */
export function VisibilityFields({ form, onChange }: { form: BookForm; onChange: (patch: Partial<BookForm>) => void }) {
  const t = useT("library.manage.editor.visibility")
  const id = useId()
  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 text-sm font-medium">{t("label")}</legend>
        {(["lyceum", "public"] as const).map((value) => (
          <Label key={value} className="min-h-11 cursor-pointer gap-3 font-normal md:min-h-9">
            <input
              type="radio"
              name={`${id}-visibility`}
              value={value}
              checked={form.visibility === value}
              onChange={() => onChange({ visibility: value })}
              className="size-4"
            />
            <span className="flex flex-col">
              <span>{t(value)}</span>
              <span className="text-muted-foreground text-xs">{t(`${value}Hint`)}</span>
            </span>
          </Label>
        ))}
      </fieldset>
      <div className="flex min-h-11 items-center justify-between gap-3">
        <div className="min-w-0">
          <p id={`${id}-download`} className="text-sm font-medium">
            {t("download")}
          </p>
          <p className="text-muted-foreground text-xs">{t("downloadHint")}</p>
        </div>
        <Switch
          checked={form.downloadAllowed}
          aria-labelledby={`${id}-download`}
          onCheckedChange={(downloadAllowed) => onChange({ downloadAllowed })}
        />
      </div>
    </div>
  )
}
