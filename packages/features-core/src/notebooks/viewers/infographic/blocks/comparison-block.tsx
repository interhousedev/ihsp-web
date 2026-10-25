"use client"

import { BlockFrame } from "./block-frame"
import type { BlockProps } from "./block-props"

/** Two or three columns side by side, each with a title and points. */
export function ComparisonBlock(props: BlockProps) {
  const columns = props.block.columns ?? []
  return (
    <BlockFrame {...props}>
      <div
        className="grid gap-[18px]"
        style={{ gridTemplateColumns: `repeat(${Math.max(1, Math.min(columns.length, 3))}, minmax(0, 1fr))` }}
      >
        {columns.map((column, index) => (
          <div key={index} className="flex min-w-0 flex-col gap-[10px]">
            <h4 className="border-b-[3px] border-(--ig-accent) pb-[6px] text-[20px] leading-[1.2] font-bold">
              {column.title}
            </h4>
            <ul className="flex flex-col gap-[7px]">
              {column.points.map((point, pointIndex) => (
                <li key={pointIndex} className="flex items-baseline gap-[9px] text-[16px] leading-[1.35]">
                  <span aria-hidden className="size-[7px] shrink-0 -translate-y-[2px] rounded-full bg-(--ig-accent)" />
                  <span className="min-w-0 [overflow-wrap:anywhere]">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </BlockFrame>
  )
}
