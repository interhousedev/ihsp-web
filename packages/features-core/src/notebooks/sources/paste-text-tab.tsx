"use client"

import { useT } from "@ihsp/i18n"
import { Button, Input, Label, Textarea } from "@ihsp/ui"
import { useId } from "react"
import { MAX_TEXT_CHARS } from "./constants"

export type PastedText = { title: string; body: string }

type PasteTextTabProps = {
  value: PastedText
  onChange: (value: PastedText) => void
  disabled: boolean
  /** Adds everything chosen so far (this text included); the text tab's own button. */
  onSubmit: () => void
}

/** Whether the pasted text can be added: a title and some text. */
export function isPastedTextComplete(value: PastedText): boolean {
  return value.title.trim() !== "" && value.body.trim() !== ""
}

/** The Text tab: a title and a large "Paste text here" field. */
export function PasteTextTab({ value, onChange, disabled, onSubmit }: PasteTextTabProps) {
  const t = useT("notebooks")
  const titleId = useId()
  const bodyId = useId()
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (!disabled) onSubmit()
      }}
    >
      <div className="flex flex-col gap-1">
        <Label htmlFor={titleId}>{t("add.textTitle")}</Label>
        <Input
          id={titleId}
          value={value.title}
          maxLength={200}
          className="h-11 md:h-8"
          onChange={(event) => onChange({ ...value, title: event.target.value })}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor={bodyId}>{t("add.textBody")}</Label>
        <Textarea
          id={bodyId}
          value={value.body}
          maxLength={MAX_TEXT_CHARS}
          placeholder={t("add.textBody")}
          className="min-h-48"
          onChange={(event) => onChange({ ...value, body: event.target.value })}
        />
      </div>
      <Button type="submit" className="min-h-11 self-end" disabled={disabled || !isPastedTextComplete(value)}>
        {t("add.textAdd")}
      </Button>
    </form>
  )
}
