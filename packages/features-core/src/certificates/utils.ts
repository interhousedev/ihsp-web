import type { CertificateEntry, CertificateType } from "@ihsp/api"

/** The type's name in the active locale (`uz`, `ru` or `en`), falling back to the code. */
export function typeName(type: CertificateType | undefined, locale: string): string {
  if (!type) return ""
  const names = type.name as Record<string, string | undefined>
  return names[locale] || type.name.en || type.code
}

/** One line with what the entry holds: level, score, percent, subject, year. */
export function entrySummary(entry: CertificateEntry): string {
  const parts: string[] = []
  if (entry.level) parts.push(entry.level)
  if (entry.score != null) parts.push(String(entry.score))
  if (entry.percent != null) parts.push(`${entry.percent}%`)
  if (entry.subject) parts.push(entry.subject)
  if (entry.year != null) parts.push(String(entry.year))
  return parts.join(" · ")
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
