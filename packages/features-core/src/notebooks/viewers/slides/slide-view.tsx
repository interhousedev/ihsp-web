"use client"

import type { Slide } from "@ihsp/api"
import type { ComponentType } from "react"
import { BulletsSlide } from "./layouts/bullets-slide"
import type { LayoutProps } from "./layouts/layout-props"
import { QuoteSlide } from "./layouts/quote-slide"
import { SectionSlide } from "./layouts/section-slide"
import { SummarySlide } from "./layouts/summary-slide"
import { TableSlide } from "./layouts/table-slide"
import { TitleSlide } from "./layouts/title-slide"
import { TwoColumnsSlide } from "./layouts/two-columns-slide"
import { SlideFrame } from "./slide-frame"
import { textTier } from "./slide-deck-state"
import { VisualHint } from "./visual-hint"

const LAYOUTS: Record<Slide["layout"], ComponentType<LayoutProps>> = {
  title: TitleSlide,
  section: SectionSlide,
  bullets: BulletsSlide,
  two_columns: TwoColumnsSlide,
  quote: QuoteSlide,
  table: TableSlide,
  summary: SummarySlide,
}

type SlideViewProps = {
  slide: Slide
  deckSubtitle?: string | null
  /** Edit mode: show the dashed placeholder for `visual_hint`. */
  showHint?: boolean
  className?: string
}

/** One slide, drawn in HTML for its layout. Used for the stage, the thumbnails, the slideshow and the print stack. */
export function SlideView({ slide, deckSubtitle, showHint = false, className }: SlideViewProps) {
  const Layout = LAYOUTS[slide.layout]
  const hint = showHint && slide.visual_hint ? <VisualHint hint={slide.visual_hint} /> : null
  return (
    <SlideFrame data-layout={slide.layout} className={className}>
      <Layout slide={slide} tier={textTier(slide)} deckSubtitle={deckSubtitle} hint={hint} />
    </SlideFrame>
  )
}
