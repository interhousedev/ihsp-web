"use client"

import { BlockFrame } from "./block-frame"
import type { BlockProps } from "./block-props"

/** Dated events along a vertical line (the head is the date, the body the event). */
export function TimelineBlock(props: BlockProps) {
  const { items } = props.block
  return (
    <BlockFrame {...props}>
      <ol className="flex flex-col">
        {items.map((item, index) => (
          <li key={index} className="relative flex min-w-0 flex-col gap-[2px] ps-[30px] pb-[14px] last:pb-0">
            {index < items.length - 1 ? (
              <span aria-hidden className="absolute start-[6px] top-[18px] bottom-0 w-[2px] bg-(--ig-accent)/40" />
            ) : null}
            <span aria-hidden className="absolute start-0 top-[5px] size-[14px] rounded-full bg-(--ig-accent)" />
            <p className="text-[17px] leading-[1.2] font-bold text-(--ig-accent)">{item.head}</p>
            {item.body ? <p className="text-[16px] leading-[1.35] [overflow-wrap:anywhere]">{item.body}</p> : null}
          </li>
        ))}
      </ol>
    </BlockFrame>
  )
}
