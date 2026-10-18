import type { CertificateEntry, CertificateType, CustomValue } from "@ihsp/api"

/** The type's name in the active locale (`uz`, `ru` or `en`), falling back to the code. */
export function typeName(type: CertificateType | undefined, locale: string): string {
  if (!type) return ""
  const names = type.name as Record<string, string | undefined>
  return names[locale] || type.name.en || type.code
}

/** One line with the entry's custom values, in the type's field order. */
export function entrySummary(entry: CertificateEntry, type?: CertificateType): string {
  const keys = type ? type.custom_fields.map((field) => field.key) : Object.keys(entry.custom_values)
  return keys
    .map((key) => formatCustomValue(entry.custom_values[key]))
    .filter((text) => text !== "")
    .join(" · ")
}

function formatCustomValue(value: CustomValue | undefined): string {
  if (value === undefined) return ""
  if (Array.isArray(value)) return value.join(", ")
  return String(value)
}

/** Levels typed as "A1, A2" to a list without blanks and duplicates. */
export function parseLevels(text: string): string[] {
  return [
    ...new Set(
      text
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean),
    ),
  ]
}

/** Gives the browser a blob as a download. */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
