import type { CSSProperties } from "react"
import type { Bounds } from "./layout"
import type { Size } from "./transform"

const CARD_WIDTH = 320
const CARD_HEIGHT_ESTIMATE = 220
const CARD_GAP = 10
const CARD_MARGIN = 8

/** Where the details card goes: under the node when there is room, above it otherwise, always inside the canvas. */
export function cardPlacement(anchor: Bounds, size: Size): CSSProperties {
  const width = Math.min(CARD_WIDTH, Math.max(160, size.width - CARD_MARGIN * 2))
  const centred = anchor.x + anchor.width / 2 - width / 2
  const left = Math.min(Math.max(centred, CARD_MARGIN), Math.max(CARD_MARGIN, size.width - width - CARD_MARGIN))
  const below = anchor.y + anchor.height + CARD_GAP
  if (below + CARD_HEIGHT_ESTIMATE <= size.height || anchor.y - CARD_GAP - CARD_HEIGHT_ESTIMATE < 0) {
    return { left, top: Math.min(Math.max(below, CARD_MARGIN), Math.max(CARD_MARGIN, size.height - 96)), width }
  }
  return { left, bottom: Math.max(CARD_MARGIN, size.height - anchor.y + CARD_GAP), width }
}
