/** Tags typed as a comma-separated list: trimmed, without empty or repeated ones, at most 20. */
export function parseTags(text: string): string[] {
  const tags = text
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag !== "")
  return [...new Set(tags)].slice(0, 20)
}
