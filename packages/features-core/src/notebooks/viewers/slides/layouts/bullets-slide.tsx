"use client"

import { SlideBullets, BODY_SIZE } from "../slide-bullets"
import type { LayoutProps } from "./layout-props"

/** A heading with a list of points (and a paragraph in detailed decks). */
export function BulletsSlide({ slide, tier, hint }: LayoutProps) {
  return (
    <div className="flex h-full flex-col gap-[2.4cqw] p-[5cqw]">
      <h2 className="border-primary border-b-[0.5cqw] pb-[1.2cqw] text-[length:4.6cqw] leading-tight font-bold [overflow-wrap:anywhere]">
        {slide.title}
      </h2>
      {slide.body ? <p className={`text-muted-foreground leading-snug ${BODY_SIZE[tier]}`}>{slide.body}</p> : null}
      <SlideBullets bullets={slide.bullets ?? []} tier={tier} />
      {hint}
    </div>
  )
}
