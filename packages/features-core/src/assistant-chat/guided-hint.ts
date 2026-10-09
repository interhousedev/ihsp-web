/** Guided learning (spec § 5.2): the sent text starts with a localized hint line for the assistant. */
export function withGuidedHint(hint: string, text: string): string {
  return `${hint}\n\n${text}`
}

/** Splits the hint line off a stored user message so the bubble shows only what the student typed. */
export function splitGuidedHint(hint: string, text: string): { guided: boolean; text: string } {
  const prefix = `${hint}\n\n`
  return text.startsWith(prefix) ? { guided: true, text: text.slice(prefix.length) } : { guided: false, text }
}
