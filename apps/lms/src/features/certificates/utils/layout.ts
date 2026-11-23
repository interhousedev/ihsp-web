import type { CertField, CertFieldKey, CertTier } from "@ihsp/api"

/** The smallest box side, as a fraction of the template (matches the server's `ge=0.01` with some room to grab). */
export const MIN_SIDE = 0.02
/** Keyboard nudge: one arrow press moves by a small step, Shift moves by a large one. */
export const NUDGE_STEP = 0.005
export const NUDGE_STEP_LARGE = 0.05
/** Text size bounds (fraction of the template height) accepted by the server. */
export const SIZE_MIN = 0.01
export const SIZE_MAX = 0.2

export type Box = Pick<CertField, "x" | "y" | "w" | "h">
/** A corner handle of the selected box. */
export type Handle = "nw" | "ne" | "sw" | "se"

const round = (value: number) => Math.round(value * 10000) / 10000

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** A pointer movement in pixels of the rendered canvas as a movement in template fractions. */
export function pxToFraction(dxPx: number, dyPx: number, canvas: { width: number; height: number }) {
  return {
    dx: canvas.width > 0 ? dxPx / canvas.width : 0,
    dy: canvas.height > 0 ? dyPx / canvas.height : 0,
  }
}

/** Keeps a box inside the template and at least `MIN_SIDE` wide and tall. */
export function clampBox(box: Box): Box {
  const w = clamp(box.w, MIN_SIDE, 1)
  const h = clamp(box.h, MIN_SIDE, 1)
  return { x: round(clamp(box.x, 0, 1 - w)), y: round(clamp(box.y, 0, 1 - h)), w: round(w), h: round(h) }
}

/** Moves a box by fractions; it stops at the template edges without shrinking. */
export function moveBox(box: Box, dx: number, dy: number): Box {
  return clampBox({ ...box, x: box.x + dx, y: box.y + dy })
}

/** Resizes a box by dragging one corner; the opposite corner stays put and the box stays inside the template. */
export function resizeBox(box: Box, handle: Handle, dx: number, dy: number): Box {
  let left = box.x
  let top = box.y
  let right = box.x + box.w
  let bottom = box.y + box.h
  if (handle === "nw" || handle === "sw") left = clamp(left + dx, 0, right - MIN_SIDE)
  else right = clamp(right + dx, left + MIN_SIDE, 1)
  if (handle === "nw" || handle === "ne") top = clamp(top + dy, 0, bottom - MIN_SIDE)
  else bottom = clamp(bottom + dy, top + MIN_SIDE, 1)
  return { x: round(left), y: round(top), w: round(right - left), h: round(bottom - top) }
}

const ARROWS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
}

/**
 * The box after an arrow key: moves it, or with `resize` (Alt) grows/shrinks its right and bottom edges. `null` for
 * other keys.
 */
export function nudgeBox(box: Box, key: string, options: { large?: boolean; resize?: boolean } = {}): Box | null {
  const arrow = ARROWS[key]
  if (!arrow) return null
  const step = options.large ? NUDGE_STEP_LARGE : NUDGE_STEP
  const [dx, dy] = [arrow[0] * step, arrow[1] * step]
  return options.resize ? resizeBox(box, "se", dx, dy) : moveBox(box, dx, dy)
}

const pct = (value: number) => `${round(value * 100)}%`

/** CSS position of a box over a canvas of any rendered size. */
export function boxStyle(box: Box): { left: string; top: string; width: string; height: string } {
  return { left: pct(box.x), top: pct(box.y), width: pct(box.w), height: pct(box.h) }
}

/** Font size in CSS pixels for a canvas rendered `canvasHeight` pixels tall. */
export function fontPx(size: number, canvasHeight: number): number {
  return Math.max(1, size * canvasHeight)
}

/** The QR box is square on the printed page: its height follows its width and the template's aspect ratio. */
export function squareQr(box: Box, template: { width_px: number; height_px: number }): Box {
  const ratio = template.height_px > 0 ? template.width_px / template.height_px : 1
  return clampBox({ ...box, h: box.w * ratio })
}

const DEFAULTS: Record<CertFieldKey, Partial<CertField>> = {
  name: { y: 0.42, h: 0.1, size: 0.07, weight: 700 },
  course: { y: 0.56, h: 0.06, size: 0.035, weight: 500 },
  tier: { y: 0.64, h: 0.05, size: 0.03, weight: 600 },
  date: { x: 0.1, y: 0.82, w: 0.3, h: 0.05, size: 0.025, align: "left" },
  partner: { x: 0.35, y: 0.82, w: 0.3, h: 0.05, size: 0.025 },
  code: { x: 0.6, y: 0.9, w: 0.25, h: 0.04, size: 0.02, align: "right" },
  qr: { x: 0.86, y: 0.76, w: 0.1, h: 0.14 },
  custom_text: { y: 0.28, h: 0.06, size: 0.03 },
}

/** A new field of the given kind at a sensible spot. */
export function newField(key: CertFieldKey, template: { width_px: number; height_px: number }): CertField {
  const field: CertField = {
    key,
    x: 0.15,
    y: 0.4,
    w: 0.7,
    h: 0.08,
    font: "montserrat",
    size: 0.04,
    weight: 400,
    color: "#111111",
    align: "center",
    text: key === "custom_text" ? "" : null,
    ...DEFAULTS[key],
  }
  return key === "qr" ? { ...field, ...squareQr(field, template) } : field
}

/** A tier key unique in the list, from its English label (`with_honors`). */
export function tierKey(label: string, taken: readonly string[]): string {
  const base =
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^[^a-z]+|_+$/g, "")
      .slice(0, 20) || "tier"
  let key = base
  for (let n = 2; taken.includes(key); n += 1) key = `${base}_${n}`
  return key
}

/** Whole percentage points still missing to a tier's own mark (or to the passing mark when it has none). */
export function remainingToTier(progress: number, tier: Pick<CertTier, "min_pct"> | null, passing: number): number {
  const target = tier?.min_pct ?? passing
  return Math.max(0, Math.ceil(target - progress))
}
