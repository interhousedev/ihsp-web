import { downloadBlob, fileNameFor } from "../../lib/download"
import { LIGHT_PALETTE, buildMindMapSvg, type ExportPalette } from "./export-svg"
import type { MindMapLayout } from "./layout"

const PNG_SCALE = 2
/** Browsers refuse canvases beyond roughly this size on a side. */
const MAX_CANVAS_SIDE = 8192
const IMAGE_TIMEOUT_MS = 15_000

/** The computed colour of a CSS value such as `var(--chart-1)`, or `fallback` when the browser cannot resolve it. */
function resolveColor(host: HTMLElement, value: string, fallback: string): string {
  try {
    const probe = document.createElement("span")
    probe.style.color = value
    host.append(probe)
    const resolved = getComputedStyle(probe).color
    probe.remove()
    return resolved && !resolved.includes("var(") ? resolved : fallback
  } catch {
    return fallback
  }
}

/** Resolves the theme tokens used by the map to concrete colours (they are lost when an SVG is serialized). */
export function resolvePalette(host: HTMLElement): ExportPalette {
  const fallback = LIGHT_PALETTE
  let fontFamily = fallback.fontFamily
  try {
    fontFamily = getComputedStyle(host).fontFamily || fontFamily
  } catch {
    // keep the fallback font
  }
  return {
    background: resolveColor(host, "var(--background)", fallback.background),
    foreground: resolveColor(host, "var(--foreground)", fallback.foreground),
    primary: resolveColor(host, "var(--primary)", fallback.primary),
    primaryForeground: resolveColor(host, "var(--primary-foreground)", fallback.primaryForeground),
    branches: fallback.branches.map((color, index) => resolveColor(host, `var(--chart-${index + 1})`, color)),
    fontFamily,
  }
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const timer = setTimeout(() => reject(new Error("image-timeout")), IMAGE_TIMEOUT_MS)
    image.addEventListener("load", () => {
      clearTimeout(timer)
      resolve(image)
    })
    image.addEventListener("error", () => {
      clearTimeout(timer)
      reject(new Error("image-failed"))
    })
    image.src = source
  })
}

/**
 * Draws an SVG string into a canvas at 2x and returns the PNG. Rejects (instead of hanging) when the environment has no
 * canvas, so callers can show an error.
 */
export async function svgToPngBlob(svg: string, width: number, height: number, scale = PNG_SCALE): Promise<Blob> {
  if (typeof Image === "undefined" || typeof document === "undefined") throw new Error("canvas-unavailable")
  const factor = Math.min(scale, MAX_CANVAS_SIDE / Math.max(width, height, 1))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(width * factor))
  canvas.height = Math.max(1, Math.round(height * factor))
  const context = canvas.getContext("2d")
  if (!context) throw new Error("canvas-unavailable")

  const image = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`)
  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("png-failed"))), "image/png")
  })
}

/** Saves the visible map as `<title>.png`. Throws when the browser cannot draw the image. */
export async function downloadMindMapPng(layout: MindMapLayout, title: string, host: HTMLElement): Promise<void> {
  const { svg, width, height } = buildMindMapSvg(layout, resolvePalette(host))
  const blob = await svgToPngBlob(svg, width, height)
  downloadBlob(fileNameFor(title, "png"), blob)
}
