"use client"

import type { StepView } from "@ihsp/api"
import { useSession } from "@ihsp/auth"
import { useT } from "@ihsp/i18n"
import { Markdown } from "@ihsp/ui"
import { useEffect, useRef } from "react"
import { SignInButton } from "../../shell/components/sign-in-button"
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
  const t = useT("guest")
  const guest = useSession().status === "anonymous"
  // Tests, flash cards, H5P, interactive and uploaded videos belong to a signed-in learner; the rest reads for everyone.
  const needsSignIn =
    guest &&
    (block.type === "test" ||
      block.type === "flashcards" ||
      block.type === "h5p" ||
      block.type === "interactive_video" ||
      (block.type === "video" && Boolean(block.file_id)))
  const shown = useRef(focusKey)

  useEffect(() => {
    if (shown.current === focusKey) return
    shown.current = focusKey
    region.current?.focus({ preventScroll: true })
  }, [focusKey])

  return (
    <div ref={region} tabIndex={-1} className="px-4 py-5 outline-none md:px-6" data-block-type={block.type}>
      {needsSignIn ? (
        <div className="flex flex-col items-start gap-3 rounded-lg border p-4">
          <p className="text-sm">
            {t(block.type === "test" ? "testCta" : block.type === "flashcards" ? "cardsCta" : "mediaCta")}
          </p>
          <SignInButton />
        </div>
      ) : block.type === "text" ? (
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
