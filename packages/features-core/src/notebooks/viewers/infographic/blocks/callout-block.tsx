"use client"

import { useT } from "@ihsp/i18n"
import { BlockFrame } from "./block-frame"
import type { BlockProps } from "./block-props"

/** The one key takeaway, as a banner in the accent colour. */
export function CalloutBlock(props: BlockProps) {
  const t = useT("notebooks.infographic")
  const { block } = props
  return (
    <BlockFrame {...props} accent title={block.title || t("takeaway")}>
      {block.items.map((item, index) => (
        <div key={index} className="flex min-w-0 flex-col gap-[6px]">
          <p className="text-[26px] leading-[1.2] font-extrabold [overflow-wrap:anywhere]">{item.head}</p>
          {item.body ? <p className="text-[18px] leading-[1.35] opacity-95">{item.body}</p> : null}
        </div>
      ))}
    </BlockFrame>
  )
}
