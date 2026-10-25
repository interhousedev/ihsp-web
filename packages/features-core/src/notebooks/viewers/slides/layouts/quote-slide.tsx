"use client"

import type { LayoutProps } from "./layout-props"

const OPEN_QUOTE = "“"
const DASH = "—"

/** One big quotation with its author or source. */
export function QuoteSlide({ slide, hint }: LayoutProps) {
  const quote = slide.quote
  return (
    <figure className="flex h-full flex-col justify-center gap-[1.6cqw] p-[8cqw]">
      {slide.title ? (
        <h2 className="text-muted-foreground text-[length:2.8cqw] font-semibold [overflow-wrap:anywhere]">
          {slide.title}
        </h2>
      ) : null}
      <span aria-hidden className="text-primary font-serif text-[length:11cqw] leading-[0.6]">
        {OPEN_QUOTE}
      </span>
      <blockquote className="text-[length:4cqw] leading-snug font-medium italic [overflow-wrap:anywhere]">
        {quote?.text}
      </blockquote>
      {quote?.attribution ? (
        <figcaption className="text-muted-foreground text-[length:2.6cqw]">
          <span aria-hidden>{DASH} </span>
          {quote.attribution}
        </figcaption>
      ) : null}
      {hint}
    </figure>
  )
}
