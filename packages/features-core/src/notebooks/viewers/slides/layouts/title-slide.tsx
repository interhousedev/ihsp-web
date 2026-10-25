"use client"

import { SlideBullets, BODY_SIZE } from "../slide-bullets"
import type { LayoutProps } from "./layout-props"

/** The opening slide: big title on the primary colour, then a subtitle or short lines. */
export function TitleSlide({ slide, tier, deckSubtitle, hint }: LayoutProps) {
  const lines = slide.bullets ?? []
  const subtitle = !slide.body && lines.length === 0 ? deckSubtitle : null
  return (
    <div className="bg-primary text-primary-foreground flex h-full flex-col justify-center gap-[2.4cqw] p-[8cqw]">
      <h2 className="text-[length:7cqw] leading-tight font-bold [overflow-wrap:anywhere]">{slide.title}</h2>
      <span aria-hidden className="bg-primary-foreground/70 block h-[0.8cqw] w-[10cqw] rounded-full" />
      {subtitle ? <p className="text-primary-foreground/85 text-[length:3.4cqw]">{subtitle}</p> : null}
      {slide.body ? <p className={`text-primary-foreground/85 ${BODY_SIZE[tier]}`}>{slide.body}</p> : null}
      <SlideBullets bullets={lines} tier={tier} inverse className="text-primary-foreground/90" />
      {hint}
    </div>
  )
}
