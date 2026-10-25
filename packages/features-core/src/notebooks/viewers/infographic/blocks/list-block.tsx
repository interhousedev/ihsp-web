"use client"

import { BlockFrame } from "./block-frame"
import type { BlockProps } from "./block-props"

/** A short list of points (the head is optional, the body is the explanation). */
export function ListBlock(props: BlockProps) {
  return (
    <BlockFrame {...props}>
      <ul className="flex flex-col gap-[10px]">
        {props.block.items.map((item, index) => (
          <li key={index} className="flex items-baseline gap-[10px] text-[17px] leading-[1.35]">
            <span aria-hidden className="size-[9px] shrink-0 -translate-y-[1px] rounded-[2px] bg-(--ig-accent)" />
            <span className="min-w-0 [overflow-wrap:anywhere]">
              {item.head ? <strong className="font-bold">{item.head}</strong> : null}
              {item.head && item.body ? " " : null}
              {item.body ? <span className="text-(--ig-muted)">{item.body}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </BlockFrame>
  )
}
