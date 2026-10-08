"use client"

import type { StepContent } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { BlockView } from "./block-view"

/** A whole step as authors see it: title and blocks in order. */
export function StepContentView({ content }: { content: StepContent }) {
  const t = useT("blocks")
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-base font-semibold break-words">{content.title || t("untitled")}</h3>
      {content.blocks.length === 0 ? <p className="text-muted-foreground text-sm">{t("noBlocks")}</p> : null}
      {content.blocks.map((block) => (
        <section key={block.id} className="flex flex-col gap-1">
          <p className="text-muted-foreground text-xs font-medium uppercase">{t(`types.${block.type}`)}</p>
          <BlockView block={block} />
        </section>
      ))}
    </div>
  )
}
