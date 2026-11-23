"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, Input } from "@ihsp/ui"
import { isHttpsImageUrl } from "./image-url-field"

/** Rows of https links: add and remove rows, each validated. Empty rows are ignored by `cleanUrls`. */
export function UrlListField({
  label,
  value,
  onChange,
  max,
  required,
  requiredText,
}: {
  label: string
  value: string[]
  onChange: (urls: string[]) => void
  max: number
  required?: boolean
  requiredText?: string
}) {
  const t = useT("settingsUx")
  const set = (i: number, next: string) => onChange(value.map((u, j) => (j === i ? next : u)))
  const missing = required && cleanUrls(value).length === 0
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-1.5">
      <span className="text-sm">{label}</span>
      {value.map((url, i) => {
        const bad = url.trim() !== "" && !isHttpsImageUrl(url)
        return (
          <div key={i} className="flex flex-col gap-1">
            <div className="flex gap-2">
              <Input
                type="url"
                inputMode="url"
                placeholder="https://"
                maxLength={500}
                aria-label={t("urlRow", { label, n: i + 1 })}
                aria-invalid={bad || undefined}
                value={url}
                onChange={(event) => set(i, event.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="min-h-11 min-w-11 md:min-h-8 md:min-w-8"
                aria-label={t("removeUrl", { n: i + 1 })}
                onClick={() => onChange(value.filter((_, j) => j !== i))}
              >
                <Icons.trash className="size-4" />
              </Button>
            </div>
            {bad ? (
              <p role="alert" className="text-destructive text-xs">
                {t("urlInvalid")}
              </p>
            ) : null}
          </div>
        )
      })}
      {missing && requiredText ? (
        <p role="alert" className="text-destructive text-xs">
          {requiredText}
        </p>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-h-11 self-start md:min-h-8"
        disabled={value.length >= max}
        onClick={() => onChange([...value, ""])}
      >
        {t("addUrl")}
      </Button>
    </div>
  )
}

/** The non-empty links, trimmed and without repeats. */
export function cleanUrls(value: string[]): string[] {
  return [...new Set(value.map((u) => u.trim()).filter(Boolean))]
}

/** Whether every non-empty row is an https link. */
export function urlsValid(value: string[]): boolean {
  return value.every((u) => u.trim() === "" || isHttpsImageUrl(u))
}
