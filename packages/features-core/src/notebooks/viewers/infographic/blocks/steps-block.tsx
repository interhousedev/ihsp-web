"use client"

import { useT } from "@ihsp/i18n"
import { BlockFrame } from "./block-frame"
import type { BlockProps } from "./block-props"

/** A numbered process, left to right. */
export function StepsBlock(props: BlockProps) {
  const t = useT("notebooks.infographic")
  const { block } = props
  const columns = Math.max(1, Math.min(block.items.length, 4))
  return (
    <BlockFrame {...props}>
      <ol className="grid gap-[16px]" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {block.items.map((item, index) => (
          <li key={index} className="flex min-w-0 flex-col gap-[8px]">
            <span
              aria-hidden
              className="grid size-[36px] place-items-center rounded-full bg-(--ig-accent) text-[18px] font-bold text-(--ig-accent-ink)"
            >
              {index + 1}
            </span>
            <span className="sr-only">{t("step", { n: index + 1 })}</span>
            <p className="text-[19px] leading-[1.2] font-bold [overflow-wrap:anywhere]">{item.head}</p>
            {item.body ? <p className="text-[16px] leading-[1.35] text-(--ig-muted)">{item.body}</p> : null}
          </li>
        ))}
      </ol>
    </BlockFrame>
  )
}
