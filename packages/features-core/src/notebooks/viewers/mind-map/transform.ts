import type { Bounds } from "./layout"

/** The pan and zoom of the canvas: `screen = world * k + (x, y)`. */
export type Transform = { x: number; y: number; k: number }
export type Size = { width: number; height: number }
export type Point = { x: number; y: number }

export const MIN_SCALE = 0.2
export const MAX_SCALE = 3
export const FIT_PADDING = 32
/** A small map is not blown up beyond this when it is fitted. */
export const MAX_FIT_SCALE = 1.25
export const ZOOM_STEP = 1.25

export const IDENTITY: Transform = { x: 0, y: 0, k: 1 }

export function clampScale(k: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, k))
}

/** The transform that centres `bounds` in a viewport of `size` with some padding. */
export function fitTransform(bounds: Bounds, size: Size, padding = FIT_PADDING): Transform {
  if (bounds.width <= 0 || bounds.height <= 0) return { x: size.width / 2, y: size.height / 2, k: 1 }
  const k = clampScale(
    Math.min((size.width - padding * 2) / bounds.width, (size.height - padding * 2) / bounds.height, MAX_FIT_SCALE),
  )
  return {
    x: (size.width - bounds.width * k) / 2 - bounds.x * k,
    y: (size.height - bounds.height * k) / 2 - bounds.y * k,
    k,
  }
}

/** Zooms by `factor` keeping the screen point `at` fixed. */
export function zoomAt(transform: Transform, factor: number, at: Point): Transform {
  const k = clampScale(transform.k * factor)
  const ratio = k / transform.k
  return {
    x: at.x - (at.x - transform.x) * ratio,
    y: at.y - (at.y - transform.y) * ratio,
    k,
  }
}

/** The screen box of a world box. */
export function toScreen(transform: Transform, box: Bounds): Bounds {
  return {
    x: box.x * transform.k + transform.x,
    y: box.y * transform.k + transform.y,
    width: box.width * transform.k,
    height: box.height * transform.k,
  }
}

/** The smallest pan that brings a world box fully into a viewport (with a margin); the zoom stays. */
export function panIntoView(transform: Transform, box: Bounds, size: Size, margin = 16): Transform {
  const screen = toScreen(transform, box)
  let dx = 0
  let dy = 0
  if (screen.x < margin) dx = margin - screen.x
  else if (screen.x + screen.width > size.width - margin) dx = size.width - margin - (screen.x + screen.width)
  if (screen.y < margin) dy = margin - screen.y
  else if (screen.y + screen.height > size.height - margin) dy = size.height - margin - (screen.y + screen.height)
  if (dx === 0 && dy === 0) return transform
  return { ...transform, x: transform.x + dx, y: transform.y + dy }
}

/** CSS `transform` of the single group that holds the whole map. */
export function transformCss(transform: Transform): string {
  return `translate(${round(transform.x)}px, ${round(transform.y)}px) scale(${round(transform.k)})`
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000
}
