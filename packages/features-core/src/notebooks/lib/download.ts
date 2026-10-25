// Browser-side downloads and clipboard. Some Telegram WebViews block blob downloads, so every Download in a viewer
// also offers Copy.

/** Saves text as a file through a temporary link. */
export function downloadText(filename: string, content: string, mime = "text/plain;charset=utf-8"): void {
  downloadBlob(filename, new Blob([content], { type: mime }))
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.rel = "noopener"
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Copies text; resolves `false` when the browser refuses. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/** A safe file name from a title: letters, digits, dashes; falls back to `fallback`. */
export function fileNameFor(title: string, extension: string, fallback = "notebook"): string {
  const slug = title
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
  return `${slug || fallback}.${extension}`
}
