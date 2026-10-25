"use client"

import { SlideBullets, BODY_SIZE } from "../slide-bullets"
import type { LayoutProps } from "./layout-props"

/** The closing slide: the points to remember, each with a check mark. */
export function SummarySlide({ slide, tier, hint }: LayoutProps) {
  return (
    <div className="bg-primary/5 flex h-full flex-col gap-[2.4cqw] p-[5cqw]">
      <h2 className="text-primary text-[length:5cqw] leading-tight font-bold [overflow-wrap:anywhere]">
        {slide.title}
      </h2>
      {slide.body ? <p className={`text-muted-foreground leading-snug ${BODY_SIZE[tier]}`}>{slide.body}</p> : null}
      <SlideBullets bullets={slide.bullets ?? []} tier={tier} marker="check" />
      {hint}
    </div>
  )
}
