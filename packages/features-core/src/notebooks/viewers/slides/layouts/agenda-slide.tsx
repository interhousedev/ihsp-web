"use client"

import type { LayoutProps } from "./layout-props"

/** The plan of the talk: the numbered topics of the deck. */
export function AgendaSlide({ slide, hint }: LayoutProps) {
  const items = slide.bullets ?? []
  return (
    <div className="flex h-full flex-col gap-[2.4cqw] p-[5cqw]">
      <h2 className="border-primary border-b-[0.5cqw] pb-[1.2cqw] text-[length:4.6cqw] leading-tight font-bold [overflow-wrap:anywhere]">
        {slide.title}
      </h2>
      <ol className="flex flex-col gap-[1.4cqw] text-[length:2.9cqw]">
        {items.map((item, index) => (
          <li key={index} className="flex items-baseline gap-[1.6cqw] leading-snug">
            <span className="text-primary w-[3cqw] shrink-0 text-right font-bold tabular-nums">{index + 1}</span>
            <span className="min-w-0 [overflow-wrap:anywhere]">{item}</span>
          </li>
        ))}
      </ol>
      {hint}
    </div>
  )
}
