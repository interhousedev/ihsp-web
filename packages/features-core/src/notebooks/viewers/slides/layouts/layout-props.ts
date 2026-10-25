import type { Slide } from "@ihsp/api"
import type { ReactNode } from "react"
import type { TextTier } from "../slide-deck-state"

/** Props of the renderer of one slide layout. */
export type LayoutProps = {
  slide: Slide
  tier: TextTier
  /** The subtitle of the deck, shown on a title slide that has no lines of its own. */
  deckSubtitle?: string | null
  /** The dashed picture placeholder (edit mode) or null. */
  hint: ReactNode
}
