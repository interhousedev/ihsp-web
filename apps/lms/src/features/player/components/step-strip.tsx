"use client"

import type { StepView } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { StepSquare } from "./step-square"

/**
 * The strip of squares in the top bar, one per step (block) of the lesson, like Stepik's. It scrolls sideways when the
 * lesson has more steps than the screen has room for.
 */
export function StepStrip({
  blocks,
  current,
  hrefFor,
}: {
  blocks: StepView["blocks"]
  /** 0-based index of the open step. */
  current: number
  hrefFor: (index: number) => string
}) {
  const t = useT("player")
  if (blocks.length === 0) return null
  return (
    <nav aria-label={t("stepsOfLesson")} className="overflow-x-auto overscroll-x-contain py-1">
      <ol className="flex w-max items-center gap-1 px-1">
        {blocks.map((block, index) => (
          <li key={block.id}>
            <StepSquare block={block} number={index + 1} current={index === current} href={hrefFor(index)} />
          </li>
        ))}
      </ol>
    </nav>
  )
}
