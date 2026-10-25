/**
 * The share slug in what a student pasted: a link (`https://share.example/ai/<slug>/`) or the slug itself.
 * Returns null when nothing usable is there.
 */
export function parseShareInput(input: string): string | null {
  const text = input.trim()
  if (!text) return null
  let path = text
  try {
    path = new URL(text).pathname
  } catch {
    // Not a URL: a bare slug or a path like `/ai/<slug>/`.
  }
  const parts = path.split("/").filter(Boolean)
  const rest = parts[0] === "ai" ? parts.slice(1) : parts
  const slug = rest[0]
  if (!slug || rest.length > 1 || /\s/.test(slug)) return null
  try {
    return decodeURIComponent(slug)
  } catch {
    return slug
  }
}
