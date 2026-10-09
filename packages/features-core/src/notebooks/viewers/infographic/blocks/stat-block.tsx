"use client"

import type { BlockProps } from "./block-props"
import { BlockFrame } from "./block-frame"

/** Big numbers or terms, each with a caption. */
export function StatBlock(props: BlockProps) {
  const { block } = props
  return (
    <BlockFrame {...props}>
      <div className="flex flex-wrap gap-x-[28px] gap-y-[14px]">
        {block.items.map((item, index) => (
          <div key={index} className="flex min-w-0 flex-1 basis-[140px] flex-col gap-[6px]">
            <p className="text-[36px] leading-[1.05] font-extrabold text-(--ig-accent) [overflow-wrap:anywhere]">
              {item.head}
            </p>
            {item.body ? <p className="text-[17px] leading-[1.35] text-(--ig-muted)">{item.body}</p> : null}
          </div>
        ))}
      </div>
    </BlockFrame>
  )
}
