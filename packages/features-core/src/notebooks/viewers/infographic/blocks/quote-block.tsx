"use client"

import { BlockFrame } from "./block-frame"
import type { BlockProps } from "./block-props"

const OPEN_QUOTE = "“"
const DASH = "—"

/** A quotation (the head) and who said it (the body). */
export function QuoteBlock(props: BlockProps) {
  return (
    <BlockFrame {...props}>
      {props.block.items.map((item, index) => (
        <figure key={index} className="flex min-w-0 flex-col gap-[6px]">
          <span aria-hidden className="font-serif text-[56px] leading-[0.5] text-(--ig-accent)">
            {OPEN_QUOTE}
          </span>
          <blockquote className="text-[21px] leading-[1.3] font-semibold italic [overflow-wrap:anywhere]">
            {item.head}
          </blockquote>
          {item.body ? (
            <figcaption className="text-[15px] text-(--ig-muted)">
              <span aria-hidden>{DASH} </span>
              {item.body}
            </figcaption>
          ) : null}
        </figure>
      ))}
    </BlockFrame>
  )
}
