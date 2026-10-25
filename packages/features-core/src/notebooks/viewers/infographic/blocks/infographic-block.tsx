"use client"

import type { ComponentType } from "react"
import { CalloutBlock } from "./callout-block"
import type { BlockProps } from "./block-props"
import { ComparisonBlock } from "./comparison-block"
import { DefinitionBlock } from "./definition-block"
import { ListBlock } from "./list-block"
import { QuoteBlock } from "./quote-block"
import { StatBlock } from "./stat-block"
import { StepsBlock } from "./steps-block"
import { TimelineBlock } from "./timeline-block"

const RENDERERS: Record<BlockProps["block"]["type"], ComponentType<BlockProps>> = {
  stat: StatBlock,
  steps: StepsBlock,
  comparison: ComparisonBlock,
  list: ListBlock,
  timeline: TimelineBlock,
  definition: DefinitionBlock,
  quote: QuoteBlock,
  callout: CalloutBlock,
}

/** One block of the infographic, drawn for its type. */
export function InfographicBlockView(props: BlockProps) {
  const Renderer = RENDERERS[props.block.type]
  return <Renderer {...props} />
}
