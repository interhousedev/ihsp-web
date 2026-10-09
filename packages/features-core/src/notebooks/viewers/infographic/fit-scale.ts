/** The scale that makes a canvas of `naturalWidth` fit a container of `containerWidth` (never above 100 %). */
export function fitScale(containerWidth: number, naturalWidth: number): number {
  if (!(containerWidth > 0) || !(naturalWidth > 0)) return 1
  return Math.min(1, containerWidth / naturalWidth)
}

export const MIN_ZOOM = 0.2
export const MAX_ZOOM = 3
export const ZOOM_STEP = 0.1

/** One zoom step from `scale`, rounded to whole percents and kept inside the allowed range. */
export function stepZoom(scale: number, direction: 1 | -1): number {
  const next = Math.round((scale + direction * ZOOM_STEP) * 100) / 100
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next))
}
