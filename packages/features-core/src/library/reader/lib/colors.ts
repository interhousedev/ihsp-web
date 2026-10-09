import type { AnnotationColor } from "@ihsp/api"
import { IconCircleFilled, IconSquareFilled, IconStarFilled, IconTriangleFilled } from "@tabler/icons-react"
import type { ComponentType } from "react"

// The four highlight colours. They also differ by a shape, so colour is never the only signal
// (docs/reference/study-library.md § 9.4). Message keys: `library.annotation.color.<name>`.

export const ANNOTATION_COLORS: readonly AnnotationColor[] = ["yellow", "green", "blue", "pink"]

export const COLOR_ICONS: Record<AnnotationColor, ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  yellow: IconCircleFilled,
  green: IconSquareFilled,
  blue: IconTriangleFilled,
  pink: IconStarFilled,
}

/** Tailwind classes for a swatch or a marker (light and dark). */
export const COLOR_TEXT: Record<AnnotationColor, string> = {
  yellow: "text-yellow-500 dark:text-yellow-300",
  green: "text-green-600 dark:text-green-400",
  blue: "text-blue-600 dark:text-blue-400",
  pink: "text-pink-600 dark:text-pink-400",
}

/** Background of a highlight over a PDF page or Markdown text (the page stays readable underneath). */
export const COLOR_BACKGROUND: Record<AnnotationColor, string> = {
  yellow: "bg-yellow-300/50 dark:bg-yellow-300/35",
  green: "bg-green-400/45 dark:bg-green-400/30",
  blue: "bg-blue-400/40 dark:bg-blue-400/30",
  pink: "bg-pink-400/40 dark:bg-pink-400/30",
}

/** Left border of a quote in the annotation list. */
export const COLOR_BORDER: Record<AnnotationColor, string> = {
  yellow: "border-yellow-400",
  green: "border-green-500",
  blue: "border-blue-500",
  pink: "border-pink-500",
}

/** Plain colours for the EPUB overlay (SVG inside the book's iframe cannot use the app's CSS classes). */
export const EPUB_FILL: Record<AnnotationColor, string> = {
  yellow: "#facc15",
  green: "#4ade80",
  blue: "#60a5fa",
  pink: "#f472b6",
}

export function isAnnotationColor(value: unknown): value is AnnotationColor {
  return typeof value === "string" && (ANNOTATION_COLORS as readonly string[]).includes(value)
}
