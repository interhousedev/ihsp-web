"use client"

import { BlockFrame } from "./block-frame"
import type { BlockProps } from "./block-props"

/** Terms with their meaning. */
export function DefinitionBlock(props: BlockProps) {
  return (
    <BlockFrame {...props}>
      <dl className="flex flex-col gap-[14px]">
        {props.block.items.map((item, index) => (
          <div key={index} className="flex min-w-0 flex-col gap-[4px] border-s-[6px] border-(--ig-accent) ps-[14px]">
            <dt className="text-[26px] leading-[1.1] font-extrabold text-(--ig-accent) [overflow-wrap:anywhere]">
              {item.head}
            </dt>
            <dd className="text-[17px] leading-[1.35]">{item.body}</dd>
          </div>
        ))}
      </dl>
    </BlockFrame>
  )
}
