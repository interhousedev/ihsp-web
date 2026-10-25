"use client"

import type { Slide } from "@ihsp/api"
import { SlideBullets } from "../slide-bullets"
import type { TextTier } from "../slide-deck-state"
import type { LayoutProps } from "./layout-props"

type Column = NonNullable<Slide["left"]>

function ColumnCard({ column, tier }: { column: Column; tier: TextTier }) {
  return (
    <section className="bg-muted/50 flex min-w-0 flex-col gap-[1.6cqw] rounded-[1.4cqw] border p-[2.6cqw]">
      <h3 className="text-primary text-[length:3.4cqw] leading-tight font-semibold [overflow-wrap:anywhere]">
        {column.heading}
      </h3>
      <SlideBullets bullets={column.bullets} tier={tier} />
    </section>
  )
}

/** Two cards side by side, each with a heading and points. */
export function TwoColumnsSlide({ slide, tier, hint }: LayoutProps) {
  return (
    <div className="flex h-full flex-col gap-[2.4cqw] p-[5cqw]">
      <h2 className="border-primary border-b-[0.5cqw] pb-[1.2cqw] text-[length:4.6cqw] leading-tight font-bold [overflow-wrap:anywhere]">
        {slide.title}
      </h2>
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-[2.4cqw]">
        {slide.left ? <ColumnCard column={slide.left} tier={tier} /> : <span />}
        {slide.right ? <ColumnCard column={slide.right} tier={tier} /> : <span />}
      </div>
      {hint}
    </div>
  )
}
