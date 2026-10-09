import type { PageFit } from "./reader-settings"

// The geometry of the PDF reader: a document of hundreds of pages is a tall column of boxes, and only the boxes near the
// window hold a canvas (docs/reference/study-library.md § 9.2: "render only visible pages for 100 MB PDFs").

export type Size = { width: number; height: number }

/** Space between two pages, in CSS pixels. */
export const PAGE_GAP = 12
/** Space around the column, in CSS pixels (smaller on phones to leave more room for the page). */
export const PAGE_PADDING = 12

/** `offsets[i]` is the top of page `i` (0-based); `offsets[count]` is the height of the whole column. */
export function computeOffsets(count: number, heightOf: (index: number) => number, gap = PAGE_GAP): number[] {
  const offsets: number[] = []
  let top = PAGE_PADDING
  for (let index = 0; index < count; index += 1) {
    offsets.push(top)
    top += heightOf(index) + gap
  }
  offsets.push(top - gap + PAGE_PADDING)
  return offsets
}

/** The 0-based page whose box contains `y` (the nearest one above when `y` falls in a gap). */
export function pageAtOffset(offsets: readonly number[], y: number): number {
  const count = offsets.length - 1
  if (count <= 0) return 0
  let low = 0
  let high = count - 1
  while (low < high) {
    const middle = Math.ceil((low + high) / 2)
    if (offsets[middle]! <= y) low = middle
    else high = middle - 1
  }
  return low
}

/** The pages to mount for a window: the visible ones plus `overscan` before and `overscan * 2` after. */
export function visibleRange(
  offsets: readonly number[],
  scrollTop: number,
  viewportHeight: number,
  overscan = 1,
): { first: number; last: number } {
  const count = offsets.length - 1
  if (count <= 0) return { first: 0, last: -1 }
  const first = Math.max(0, pageAtOffset(offsets, scrollTop) - overscan)
  const last = Math.min(count - 1, pageAtOffset(offsets, scrollTop + viewportHeight) + overscan * 2)
  return { first, last }
}

/** CSS pixels per PDF point for a fit mode in a window. `zoom` is the multiplier of the "custom" mode over fit-width. */
export function fitScale(fit: PageFit, container: Size, page: Size, zoom: number, padding = PAGE_PADDING): number {
  if (page.width <= 0 || page.height <= 0) return 1
  const byWidth = Math.max(container.width - padding * 2, 120) / page.width
  if (fit === "custom") return byWidth * zoom
  if (fit === "width") return byWidth
  const byHeight = Math.max(container.height - padding * 2, 120) / page.height
  return Math.min(byWidth, byHeight)
}
