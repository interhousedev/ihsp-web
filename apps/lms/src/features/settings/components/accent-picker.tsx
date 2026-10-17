"use client"

import { useT } from "@ihsp/i18n"
import { Field, FieldError, FieldLabel, Icons, Input, cn } from "@ihsp/ui"
import { useState } from "react"
import { ACCENT_PALETTE, isHexColor, normalizeHex, readableOn } from "../utils/color"

/** Ten swatches and a hex field; an invalid hex is kept in the field and flagged, the value only changes when valid. */
export function AccentPicker({
  value,
  onChange,
  invalid,
}: {
  value: string | null
  onChange: (hex: string | null) => void
  invalid?: boolean
}) {
  const t = useT("courseSettings")
  const [text, setText] = useState<string | null>(null)
  const shown = text ?? value ?? ""
  const bad = invalid || (text !== null && text !== "" && !isHexColor(normalizeHex(text)))

  function type(next: string) {
    setText(next)
    if (next.trim() === "") onChange(null)
    else if (isHexColor(normalizeHex(next))) onChange(normalizeHex(next))
  }

  return (
    <Field>
      <FieldLabel htmlFor="accent-hex">{t("accent")}</FieldLabel>
      <div role="radiogroup" aria-label={t("accentPalette")} className="flex flex-wrap gap-2">
        {ACCENT_PALETTE.map((hex) => (
          <button
            key={hex}
            type="button"
            role="radio"
            aria-checked={value === hex}
            aria-label={hex}
            onClick={() => {
              setText(null)
              onChange(hex)
            }}
            style={{ backgroundColor: hex, color: readableOn(hex) }}
            className={cn(
              "flex size-11 items-center justify-center rounded-full border-2 border-transparent md:size-8",
              "focus-visible:ring-ring outline-none focus-visible:ring-2",
              value === hex && "border-foreground",
            )}
          >
            {value === hex ? <Icons.check aria-hidden className="size-4" /> : null}
          </button>
        ))}
      </div>
      <Input
        id="accent-hex"
        value={shown}
        placeholder="#2563eb"
        maxLength={7}
        aria-invalid={bad}
        onChange={(event) => type(event.target.value)}
        onBlur={() => setText(null)}
        className="h-11 max-w-40 md:h-8"
      />
      {bad ? <FieldError>{t("errors.hex")}</FieldError> : null}
    </Field>
  )
}
