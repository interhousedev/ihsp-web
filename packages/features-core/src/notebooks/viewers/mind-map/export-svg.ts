import type { MindMapLayout, PositionedNode } from "./layout"
import { FONT_SIZE, TOGGLE_RADIUS, lineBaselines, linesOf } from "./node-metrics"

/**
 * Concrete colours for the exported image. CSS variables (`var(--chart-1)`) do not survive when an SVG is drawn into a
 * canvas as an image, so `export-png.ts` resolves the theme tokens in the browser and passes the results here.
 */
export type ExportPalette = {
  background: string
  foreground: string
  primary: string
  primaryForeground: string
  /** The five branch colours (`--chart-1` to `--chart-5`). */
  branches: readonly string[]
  fontFamily: string
}

export const LIGHT_PALETTE: ExportPalette = {
  background: "#ffffff",
  foreground: "#171717",
  primary: "#2563eb",
  primaryForeground: "#ffffff",
  branches: ["#2563eb", "#16a34a", "#d97706", "#9333ea", "#dc2626"],
  fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
}

export type BuiltSvg = { svg: string; width: number; height: number }

const PILL_TINT = 0.18
const EDGE_OPACITY = 0.7

export function escapeXml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

function branchColor(palette: ExportPalette, branch: number | null): string {
  if (branch === null) return palette.primary
  const count = palette.branches.length
  return palette.branches[((branch % count) + count) % count] ?? palette.primary
}

function nodeSvg(item: PositionedNode, palette: ExportPalette): string {
  const isRoot = item.branch === null
  const colour = branchColor(palette, item.branch)
  const radius = Math.min(item.height / 2, 18)
  const textColour = isRoot ? palette.primaryForeground : palette.foreground
  const weight = isRoot ? 600 : 500
  const lines = linesOf(item.node)
  const baselines = lineBaselines(lines.length, item.height)

  const pill = isRoot
    ? `<rect x="${item.x}" y="${item.y}" width="${item.width}" height="${item.height}" rx="${radius}" fill="${colour}"/>`
    : `<rect x="${item.x}" y="${item.y}" width="${item.width}" height="${item.height}" rx="${radius}" fill="${colour}" fill-opacity="${PILL_TINT}" stroke="${colour}" stroke-width="1.5"/>`
  const text = lines
    .map(
      (line, index) =>
        `<text x="${item.x + item.width / 2}" y="${item.y + (baselines[index] ?? 0)}" text-anchor="middle" font-size="${FONT_SIZE}" font-weight="${weight}" fill="${textColour}">${escapeXml(line)}</text>`,
    )
    .join("")
  return `<g>${pill}${text}${item.hasChildren ? toggleSvg(item, palette, colour) : ""}</g>`
}

/** The round expand/collapse control on the right edge of a node with children. */
function toggleSvg(item: PositionedNode, palette: ExportPalette, colour: string): string {
  const cx = item.x + item.width
  const cy = item.y + item.height / 2
  // Right-pointing chevron when collapsed, left-pointing when expanded (as on screen).
  const direction = item.collapsed ? 1 : -1
  const chevron = `M ${cx - 2 * direction} ${cy - 4} L ${cx + 2 * direction} ${cy} L ${cx - 2 * direction} ${cy + 4}`
  return (
    `<circle cx="${cx}" cy="${cy}" r="${TOGGLE_RADIUS}" fill="${palette.background}" stroke="${colour}" stroke-width="1.5"/>` +
    `<path d="${chevron}" fill="none" stroke="${palette.foreground}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`
  )
}

/**
 * The map as a standalone SVG string (visible nodes only, as on screen), ready to be drawn into a canvas. Pure: no DOM.
 * The image is the layout bounds plus `padding`, with a solid background so that the PNG is not transparent.
 */
export function buildMindMapSvg(layout: MindMapLayout, palette: ExportPalette, padding = 24): BuiltSvg {
  const { bounds } = layout
  const width = Math.ceil(bounds.width + padding * 2 + TOGGLE_RADIUS)
  const height = Math.ceil(bounds.height + padding * 2)
  const shiftX = padding - bounds.x
  const shiftY = padding - bounds.y

  const edges = layout.edges
    .map(
      (edge) =>
        `<path d="${edge.path}" fill="none" stroke="${branchColor(palette, edge.branch)}" stroke-width="2" stroke-opacity="${EDGE_OPACITY}"/>`,
    )
    .join("")
  const nodes = layout.nodes.map((item) => nodeSvg(item, palette)).join("")

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="${escapeXml(palette.fontFamily)}">` +
    `<rect width="${width}" height="${height}" fill="${palette.background}"/>` +
    `<g transform="translate(${shiftX} ${shiftY})">${edges}${nodes}</g>` +
    `</svg>`
  return { svg, width, height }
}
