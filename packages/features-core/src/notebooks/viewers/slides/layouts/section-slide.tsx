"use client"

import { SlideBullets, BODY_SIZE } from "../slide-bullets"
import type { LayoutProps } from "./layout-props"

/** A divider between parts of the deck: a large title next to an accent bar. */
export function SectionSlide({ slide, tier, hint }: LayoutProps) {
  return (
    <div className="bg-muted/60 flex h-full items-stretch gap-[4cqw] p-[7cqw]">
      <span aria-hidden className="bg-primary block w-[1.4cqw] shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-[2.4cqw]">
        <h2 className="text-[length:6cqw] leading-tight font-bold [overflow-wrap:anywhere]">{slide.title}</h2>
        {slide.body ? <p className={`text-muted-foreground ${BODY_SIZE[tier]}`}>{slide.body}</p> : null}
        <SlideBullets bullets={slide.bullets ?? []} tier={tier} className="text-muted-foreground" />
        {hint}
      </div>
    </div>
  )
}
