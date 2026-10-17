"use client"

import type { StepView } from "@ihsp/api"
import { Markdown } from "@ihsp/ui"
import { useEffect, useRef } from "react"
import { FlashcardsBlock } from "./flashcards-block"
import { H5PBlock } from "./h5p-block"
import { InteractiveVideoBlock } from "./interactive-video-block"
import { TestBlock } from "./test-block"
import { VideoBlock } from "./video-block"

type Block = StepView["blocks"][number]

/**
 * The open step (block) of the lesson: Markdown text, a test or a flash card session. After the learner moves to
 * another step the focus goes to this region so keyboard and screen reader users start at the new content.
 */
export function StepContent({
  block,
  courseId,
  stepId,
  slug,
  preview,
  focusKey,
}: {
  block: Block
  courseId: string
  stepId: string
  slug: string | null
  preview: boolean
  /** Changes with the open step; the region takes focus on every change but the first. */
  focusKey: string
}) {
  const region = useRef<HTMLDivElement>(null)
  const shown = useRef(focusKey)

  useEffect(() => {
    if (shown.current === focusKey) return
    shown.current = focusKey
    region.current?.focus({ preventScroll: true })
  }, [focusKey])

  return (
    <div ref={region} tabIndex={-1} className="px-4 py-5 outline-none md:px-6" data-block-type={block.type}>
      {block.type === "text" ? (
        <Markdown key={block.id} className="text-base">
          {block.markdown}
        </Markdown>
      ) : block.type === "video" ? (
        <VideoBlock
          key={block.id}
          url={block.url}
          caption={block.caption}
          source={block.source}
          fileId={block.file_id}
          blockId={block.id}
          courseId={courseId}
          stepId={stepId}
          preview={preview}
        />
      ) : block.type === "interactive_video" ? (
        <InteractiveVideoBlock key={block.id} block={block} courseId={courseId} stepId={stepId} preview={preview} />
      ) : block.type === "h5p" ? (
        <H5PBlock key={block.id} block={block} courseId={courseId} stepId={stepId} preview={preview} />
      ) : block.type === "test" ? (
        <TestBlock key={block.id} courseId={courseId} stepId={stepId} block={block} preview={preview} slug={slug} />
      ) : (
        <FlashcardsBlock key={block.id} stepId={stepId} block={block} readOnly={preview} />
      )}
    </div>
  )
}
