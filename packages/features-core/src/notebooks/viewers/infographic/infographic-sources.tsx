"use client"

import type { InfographicBlock, RefsIndex } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Collapsible, CollapsibleContent, CollapsibleTrigger, Icons } from "@ihsp/ui"
import { RefChips, citationsFromRefs } from "../../chat/ref-chips"

type InfographicSourcesProps = {
  blocks: readonly InfographicBlock[]
  refsIndex: RefsIndex
}

/** A collapsed "Sources" row under the canvas with the chips of every block, each passage once. */
export function InfographicSources({ blocks, refsIndex }: InfographicSourcesProps) {
  const t = useT("notebooks.infographic")
  const refs = blocks.flatMap((block) => block.refs)
  const count = citationsFromRefs(refs, refsIndex).length
  if (count === 0) return null
  return (
    <Collapsible className="flex flex-col gap-2">
      <CollapsibleTrigger className="focus-visible:ring-ring group/sources flex min-h-11 w-fit items-center gap-1.5 rounded-lg px-2 text-sm font-medium outline-hidden focus-visible:ring-2 md:min-h-8">
        <Icons.chevronRight
          className="size-4 transition-transform group-aria-expanded/sources:rotate-90 motion-reduce:transition-none"
          aria-hidden
        />
        {t("sources", { count })}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <RefChips refs={refs} refsIndex={refsIndex} className="px-2" />
      </CollapsibleContent>
    </Collapsible>
  )
}
