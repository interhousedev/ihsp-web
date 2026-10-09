"use client"

import { InfographicStage } from "./infographic/infographic-stage"
import type { ViewerProps } from "./viewer-props"

/**
 * The infographic (docs/reference/notebooklm.md § 5.4.5): a fixed-size canvas laid out in HTML and CSS with the theme
 * from `options.style`, scaled to fit with zoom buttons, Download PNG (client side, no library), Print / PDF, Copy
 * text and a collapsed Sources row. `ArtifactViewer` renders the header and the states around it.
 */
export function InfographicViewer({ artifact }: ViewerProps<"infographic">) {
  if (!artifact.content) return null
  return <InfographicStage artifact={artifact} content={artifact.content} />
}
