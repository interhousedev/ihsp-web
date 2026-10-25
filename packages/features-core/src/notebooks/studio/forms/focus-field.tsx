"use client"

import { useT } from "@ihsp/i18n"
import { Label, Textarea } from "@ihsp/ui"
import { useId } from "react"
import { MAX_FOCUS_LENGTH } from "./form-state"

export type FocusFieldProps = {
  value: string
  onChange: (value: string) => void
  /** A custom report: the text is the task itself and must not be empty. */
  required?: boolean
}

/** "What should it focus on? (optional)": at most 1000 characters with a counter; it becomes the `prompt`. */
export function FocusField({ value, onChange, required = false }: FocusFieldProps) {
  const t = useT("notebooks.opt")
  const id = useId()
  const counterId = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{required ? t("customPrompt") : t("focus")}</Label>
      <Textarea
        id={id}
        value={value}
        maxLength={MAX_FOCUS_LENGTH}
        required={required}
        rows={3}
        placeholder={required ? t("customPlaceholder") : t("focusPlaceholder")}
        aria-describedby={counterId}
        className="min-h-20"
        onChange={(event) => onChange(event.target.value)}
      />
      <p id={counterId} className="text-muted-foreground self-end text-xs tabular-nums">
        {t("focusCount", { count: value.length, max: MAX_FOCUS_LENGTH })}
      </p>
    </div>
  )
}
