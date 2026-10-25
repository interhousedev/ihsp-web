"use client"

import { useT } from "@ihsp/i18n"
import { Button, Label, Textarea } from "@ihsp/ui"
import { useId } from "react"
import { parseLinks } from "./parse-links"

type LinkTabProps = {
  value: string
  onChange: (value: string) => void
  disabled: boolean
  /** Adds everything chosen so far (these links included); the link tab's own button. */
  onSubmit: () => void
}

/** The Link tab (P2): one or more web addresses separated by spaces or new lines. */
export function LinkTab({ value, onChange, disabled, onSubmit }: LinkTabProps) {
  const t = useT("notebooks")
  const fieldId = useId()
  const { urls, skipped } = parseLinks(value)
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (!disabled) onSubmit()
      }}
    >
      <div className="flex flex-col gap-1">
        <Label htmlFor={fieldId}>{t("add.link.label")}</Label>
        <Textarea
          id={fieldId}
          value={value}
          inputMode="url"
          placeholder={t("add.link.placeholder")}
          className="min-h-32"
          onChange={(event) => onChange(event.target.value)}
        />
        <p className="text-muted-foreground text-xs">{t("add.link.hint")}</p>
        {skipped.length > 0 ? (
          <p role="status" className="text-xs text-amber-700 dark:text-amber-400">
            {t("add.link.skipped", { items: skipped.join(", ") })}
          </p>
        ) : null}
      </div>
      <Button type="submit" className="min-h-11 self-end" disabled={disabled || urls.length === 0}>
        {t("add.link.add", { count: urls.length })}
      </Button>
    </form>
  )
}
