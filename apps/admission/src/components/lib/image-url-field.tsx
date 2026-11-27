"use client"

import { getConfig } from "@ihsp/config"
import { useT } from "@ihsp/i18n"
import { Input } from "@ihsp/ui"
import { useState } from "react"

function storageOrigin(): string | null {
  try {
    return new URL(getConfig().STORAGE_ORIGIN).origin
  } catch {
    return null
  }
}

/** Whether `value` is an absolute https URL or lives in our storage (plain http in dev). */
export function isHttpsImageUrl(value: string): boolean {
  try {
    const url = new URL(value.trim())
    return url.protocol === "https:" || url.origin === storageOrigin()
  } catch {
    return false
  }
}

/** A link to an image: validated as https, with a live preview so staff see what students will see. */
export function ImageUrlField({
  id,
  label,
  value,
  onChange,
  wide,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  /** A wide banner preview instead of a square one. */
  wide?: boolean
}) {
  const t = useT("settingsUx")
  const clean = value.trim()
  const valid = clean === "" || isHttpsImageUrl(clean)
  const [failed, setFailed] = useState<string | null>(null)
  const broken = failed === clean
  const errorId = `${id}-error`
  return (
    <div className="flex flex-col gap-1 text-sm">
      <label htmlFor={id}>{label}</label>
      <Input
        id={id}
        type="url"
        inputMode="url"
        placeholder="https://"
        maxLength={2000}
        value={value}
        aria-invalid={!valid || broken || undefined}
        aria-describedby={!valid || broken ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {!valid ? (
        <p id={errorId} role="alert" className="text-destructive text-xs">
          {t("urlInvalid")}
        </p>
      ) : broken ? (
        <p id={errorId} role="alert" className="text-destructive text-xs">
          {t("imageFailed")}
        </p>
      ) : null}
      {clean !== "" && valid && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={clean}
          alt={t("preview", { label })}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setFailed(clean)}
          className={
            wide
              ? "bg-muted h-24 w-full max-w-xs rounded-md border object-cover"
              : "bg-muted size-16 rounded-md border object-contain"
          }
        />
      ) : null}
    </div>
  )
}
