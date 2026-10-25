/** Accent colours of a course: the palette, hex checks and the text colour that stays readable on a swatch. */

export const ACCENT_PALETTE = [
  "#2563eb",
  "#0891b2",
  "#0d9488",
  "#16a34a",
  "#65a30d",
  "#ca8a04",
  "#ea580c",
  "#dc2626",
  "#db2777",
  "#7c3aed",
] as const

const HEX = /^#[0-9a-fA-F]{6}$/

export function isHexColor(value: string): boolean {
  return HEX.test(value)
}

/** `#abc` and `abc` become `#aabbcc`; anything else is returned trimmed. */
export function normalizeHex(value: string): string {
  const text = value.trim()
  const body = text.startsWith("#") ? text.slice(1) : text
  if (/^[0-9a-fA-F]{3}$/.test(body)) return `#${[...body].map((char) => char + char).join("")}`.toLowerCase()
  if (/^[0-9a-fA-F]{6}$/.test(body)) return `#${body}`.toLowerCase()
  return text
}

function channel(value: number): number {
  const unit = value / 255
  return unit <= 0.03928 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4
}

export function luminance(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16)
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
}

/** WCAG contrast ratio of two `#rrggbb` colours, 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].toSorted((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

/** White or near-black text, whichever contrasts more with the accent. */
export function readableOn(hex: string): "#ffffff" | "#111827" {
  if (!isHexColor(hex)) return "#111827"
  return contrastRatio(hex, "#ffffff") >= contrastRatio(hex, "#111827") ? "#ffffff" : "#111827"
}

/** CSS variables for a course accent; `undefined` when the course has none. */
export function accentStyle(hex: string | null | undefined): Record<string, string> | undefined {
  if (!hex || !isHexColor(hex)) return undefined
  return { "--course-accent": hex, "--course-accent-fg": readableOn(hex) }
}
