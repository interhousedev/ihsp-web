/** Saves text as a file on the user's device (a download from memory, no server round trip). */
export function downloadText(filename: string, text: string, type = "text/markdown;charset=utf-8"): void {
  const url = URL.createObjectURL(new Blob([text], { type }))
  try {
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = filename
    anchor.rel = "noopener"
    anchor.style.display = "none"
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
  } finally {
    // The download has started when `click` returns; the address is not needed any more.
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}

/** A safe file name from a title: letters and digits of any script, single hyphens, at most 60 characters. */
export function fileNameFor(title: string, extension: string, fallback = "library-notes"): string {
  const base = title
    .normalize("NFKC")
    .replaceAll(/[^\p{L}\p{N}]+/gu, "-")
    .replaceAll(/^-+|-+$/g, "")
    .slice(0, 60)
    .replaceAll(/-+$/g, "")
  return `${base || fallback}.${extension}`
}
