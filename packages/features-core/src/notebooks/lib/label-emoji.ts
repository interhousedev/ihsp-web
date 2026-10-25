const DEFAULT_TAG = "🏷️"
const COLOURS = ["🟦", "🟩", "🟧", "🟪", "🟥", "🟨", "🟫"] as const

/**
 * The emoji of a topic label. The server falls back to the generic tag when the model gave none, which makes every
 * group look the same; such a label gets a colour square picked from its id instead, so the groups stay apart.
 */
export function labelEmoji(label: { id: string; emoji: string }): string {
  const emoji = label.emoji.trim()
  if (emoji !== "" && emoji !== DEFAULT_TAG && emoji !== "🏷") return emoji
  let hash = 0
  for (const ch of label.id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return COLOURS[hash % COLOURS.length] ?? COLOURS[0]
}
