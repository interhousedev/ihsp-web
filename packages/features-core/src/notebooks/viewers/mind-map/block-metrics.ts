import { LINE_HEIGHT, PAD_X, PAD_Y, estimateTextWidth, wrapLabel } from "./node-metrics"

/** Size and wrapped lines of a free text block. */
export function measureText(text: string): {
  width: number
  height: number
  lines: string[]
} {
  const lines = wrapLabel(text)
  const widest = lines.reduce((width, line) => Math.max(width, estimateTextWidth(line)), 0)
  return {
    width: Math.max(widest + PAD_X * 2, 72),
    height: lines.length * LINE_HEIGHT + PAD_Y * 2,
    lines,
  }
}
