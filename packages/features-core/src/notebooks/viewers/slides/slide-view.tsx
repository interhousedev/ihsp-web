"use client"

import type { Slide } from "@ihsp/api"
import type { ComponentType } from "react"
import { AgendaSlide } from "./layouts/agenda-slide"
import { BulletsSlide } from "./layouts/bullets-slide"
import { FullImageSlide, ImageLeftSlide, ImageRightSlide } from "./layouts/image-slide"
import type { LayoutProps } from "./layouts/layout-props"
import { QuoteSlide } from "./layouts/quote-slide"
import { SectionSlide } from "./layouts/section-slide"
import { StatsSlide } from "./layouts/stats-slide"
import { SummarySlide } from "./layouts/summary-slide"
import { TableSlide } from "./layouts/table-slide"
import { TimelineSlide } from "./layouts/timeline-slide"
import { TitleSlide } from "./layouts/title-slide"
import { TwoColumnsSlide } from "./layouts/two-columns-slide"
import { SlideFrame } from "./slide-frame"
import { textTier } from "./slide-deck-state"
import { VisualHint } from "./visual-hint"

const LAYOUTS: Record<Slide["layout"], ComponentType<LayoutProps>> = {
  title: TitleSlide,
  agenda: AgendaSlide,
  section: SectionSlide,
  bullets: BulletsSlide,
  two_columns: TwoColumnsSlide,
  two_column: TwoColumnsSlide,
  comparison: TwoColumnsSlide,
  image_left: ImageLeftSlide,
  image_right: ImageRightSlide,
  full_image: FullImageSlide,
  stats: StatsSlide,
  timeline: TimelineSlide,
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
  // A layout this build does not know is drawn as plain bullets instead of crashing the viewer.
  const Layout = LAYOUTS[slide.layout] ?? BulletsSlide
  const hint = showHint && slide.visual_hint ? <VisualHint hint={slide.visual_hint} /> : null
  return (
    <SlideFrame data-layout={slide.layout} className={className}>
      <Layout slide={slide} tier={textTier(slide)} deckSubtitle={deckSubtitle} hint={hint} />
    </SlideFrame>
  )
}
