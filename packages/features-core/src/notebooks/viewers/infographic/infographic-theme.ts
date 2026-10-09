import type { ArtifactOptions } from "@ihsp/api"
import type { CSSProperties } from "react"

export type InfographicOrientation = "portrait" | "landscape" | "square"
export type InfographicStyle = "clean" | "sketch" | "bento" | "scientific" | "playful"

/** The fixed size of the canvas in CSS pixels (docs/reference/notebooklm.md § 3.4.7). */
export const CANVAS_SIZES: Record<InfographicOrientation, { width: number; height: number }> = {
  portrait: { width: 800, height: 1200 },
  landscape: { width: 1200, height: 800 },
  square: { width: 1000, height: 1000 },
}

/** Number of columns of the block grid. */
export const GRID_COLUMNS: Record<InfographicOrientation, number> = { portrait: 2, landscape: 3, square: 2 }

const ORIENTATIONS: readonly string[] = ["portrait", "landscape", "square"]
const STYLES: readonly string[] = ["clean", "sketch", "bento", "scientific", "playful"]

function optionValue(options: ArtifactOptions | null | undefined, key: string): unknown {
  return options && key in options ? (options as Record<string, unknown>)[key] : undefined
}

/** The orientation chosen when the infographic was created; portrait when it is missing. */
export function orientationOf(options: ArtifactOptions | null | undefined): InfographicOrientation {
  const value = optionValue(options, "orientation")
  return typeof value === "string" && ORIENTATIONS.includes(value) ? (value as InfographicOrientation) : "portrait"
}

/** The visual style; `clean` when it is missing (Auto). */
export function styleOf(options: ArtifactOptions | null | undefined): InfographicStyle {
  const value = optionValue(options, "style")
  return typeof value === "string" && STYLES.includes(value) ? (value as InfographicStyle) : "clean"
}

export type InfographicTheme = {
  /** CSS custom properties set on the canvas; the blocks only read these. */
  vars: Record<`--ig-${string}`, string>
  /** Backgrounds the block cards take in turn (bento tiles); empty: every card uses `--ig-card`. */
  tones: readonly string[]
}

const SANS = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
const SERIF = 'Georgia, "Times New Roman", Times, serif'
const ROUNDED = 'ui-rounded, "Nunito", "Trebuchet MS", "Segoe UI", system-ui, sans-serif'
const HAND = '"Segoe Print", "Bradley Hand", "Chalkboard SE", "Comic Sans MS", ui-rounded, system-ui, sans-serif'

/**
 * The five themes. They use fixed colours and system font stacks on purpose: an infographic is a picture that has to
 * look the same in light and dark mode, on paper and in the PNG (which cannot load web fonts).
 */
export const THEMES: Record<InfographicStyle, InfographicTheme> = {
  clean: {
    tones: [],
    vars: {
      "--ig-bg": "#ffffff",
      "--ig-ink": "#0f172a",
      "--ig-muted": "#475569",
      "--ig-accent": "#2563eb",
      "--ig-accent-ink": "#ffffff",
      "--ig-soft": "#dbeafe",
      "--ig-card": "#f8fafc",
      "--ig-line": "#e2e8f0",
      "--ig-line-style": "solid",
      "--ig-line-width": "1px",
      "--ig-radius": "16px",
      "--ig-shadow": "none",
      "--ig-font": SANS,
      "--ig-title-font": SANS,
    },
  },
  sketch: {
    tones: [],
    vars: {
      "--ig-bg": "#fffdf4",
      "--ig-ink": "#2b2b2b",
      "--ig-muted": "#5b5b5b",
      "--ig-accent": "#d9480f",
      "--ig-accent-ink": "#ffffff",
      "--ig-soft": "#ffe8cc",
      "--ig-card": "#ffffff",
      "--ig-line": "#2b2b2b",
      "--ig-line-style": "dashed",
      "--ig-line-width": "2px",
      "--ig-radius": "14px",
      "--ig-shadow": "none",
      "--ig-font": HAND,
      "--ig-title-font": HAND,
    },
  },
  bento: {
    tones: ["#ffffff", "#ede9fe", "#dcfce7", "#fef3c7", "#e0f2fe", "#fce7f3"],
    vars: {
      "--ig-bg": "#eef2f6",
      "--ig-ink": "#111827",
      "--ig-muted": "#4b5563",
      "--ig-accent": "#6d28d9",
      "--ig-accent-ink": "#ffffff",
      "--ig-soft": "#ede9fe",
      "--ig-card": "#ffffff",
      "--ig-line": "transparent",
      "--ig-line-style": "solid",
      "--ig-line-width": "0px",
      "--ig-radius": "28px",
      "--ig-shadow": "0 1px 2px rgba(15, 23, 42, 0.08)",
      "--ig-font": SANS,
      "--ig-title-font": SANS,
    },
  },
  scientific: {
    tones: [],
    vars: {
      "--ig-bg": "#fbfcff",
      "--ig-ink": "#0b1f3a",
      "--ig-muted": "#3d5170",
      "--ig-accent": "#0f766e",
      "--ig-accent-ink": "#ffffff",
      "--ig-soft": "#ccfbf1",
      "--ig-card": "#ffffff",
      "--ig-line": "#94a3b8",
      "--ig-line-style": "solid",
      "--ig-line-width": "1px",
      "--ig-radius": "4px",
      "--ig-shadow": "none",
      "--ig-font": SANS,
      "--ig-title-font": SERIF,
    },
  },
  playful: {
    tones: [],
    vars: {
      "--ig-bg": "#fff7ed",
      "--ig-ink": "#3b0764",
      "--ig-muted": "#6b21a8",
      "--ig-accent": "#db2777",
      "--ig-accent-ink": "#ffffff",
      "--ig-soft": "#fce7f3",
      "--ig-card": "#ffffff",
      "--ig-line": "#3b0764",
      "--ig-line-style": "solid",
      "--ig-line-width": "3px",
      "--ig-radius": "24px",
      "--ig-shadow": "5px 5px 0 #3b0764",
      "--ig-font": ROUNDED,
      "--ig-title-font": ROUNDED,
    },
  },
}

/** The theme as an inline `style` for the canvas. */
export function themeStyle(style: InfographicStyle): CSSProperties {
  return THEMES[style].vars as CSSProperties
}
