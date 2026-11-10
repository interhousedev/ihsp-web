"use client"

import type { LayoutProps } from "./layout-props"

/** Dated steps in order along a line. */
export function TimelineSlide({ slide, hint }: LayoutProps) {
  const steps = slide.timeline ?? []
  return (
    <div className="flex h-full flex-col gap-[3cqw] p-[5cqw]">
      <h2 className="border-primary border-b-[0.5cqw] pb-[1.2cqw] text-[length:4.6cqw] leading-tight font-bold [overflow-wrap:anywhere]">
        {slide.title}
      </h2>
      <ol className="border-primary flex min-h-0 flex-1 flex-col justify-center gap-[2cqw] border-s-[0.5cqw] ps-[3cqw]">
        {steps.map((step, index) => (
          <li key={index} className="flex items-baseline gap-[2cqw]">
            <span className="text-primary w-[14cqw] shrink-0 text-[length:3cqw] font-bold [overflow-wrap:anywhere]">
              {step.when}
            </span>
            <span className="min-w-0 text-[length:2.8cqw] leading-snug [overflow-wrap:anywhere]">{step.label}</span>
          </li>
        ))}
      </ol>
      {hint}
    </div>
  )
}
