"use client"

import type { LayoutProps } from "./layout-props"

/** Big numbers with a caption each. */
export function StatsSlide({ slide, hint }: LayoutProps) {
  const stats = slide.stats ?? []
  return (
    <div className="flex h-full flex-col gap-[3cqw] p-[5cqw]">
      <h2 className="border-primary border-b-[0.5cqw] pb-[1.2cqw] text-[length:4.6cqw] leading-tight font-bold [overflow-wrap:anywhere]">
        {slide.title}
      </h2>
      <ul className="grid min-h-0 flex-1 auto-cols-fr grid-flow-col items-center gap-[2.4cqw]">
        {stats.map((stat, index) => (
          <li key={index} className="bg-muted/50 flex min-w-0 flex-col gap-[1cqw] rounded-[1.4cqw] border p-[2.6cqw]">
            <span className="text-primary text-[length:7cqw] leading-none font-bold [overflow-wrap:anywhere]">
              {stat.value}
            </span>
            <span className="text-[length:2.6cqw] leading-snug [overflow-wrap:anywhere]">{stat.label}</span>
          </li>
        ))}
      </ul>
      {hint}
    </div>
  )
}
