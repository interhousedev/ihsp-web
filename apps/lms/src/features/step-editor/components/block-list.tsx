"use client"

import type { Block, StepContent } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useState } from "react"
import { ConfirmDialog } from "@ihsp/ui"
import { moveItem, updateBlock } from "../utils/content-ops"
import { BlockCard } from "./block-card"
import { FlashcardsBlockEditor } from "./flashcards-block-editor"
import { H5PBlockEditor } from "./h5p-block-editor"
import { InteractiveVideoBlockEditor } from "./interactive-video-block-editor"
import { MarkdownEditor } from "./markdown-editor"
import { VideoBlockEditor } from "./video-block-editor"
import { TestBlockEditor } from "./test-block-editor"

/** The blocks of the step in order, each with its editor (text, test builder, flash cards). */
export function BlockList({
  content,
  keyOf,
  edit,
  courseId,
  stepId,
}: {
  courseId?: string
  stepId?: string
  content: StepContent
  keyOf: (id: string) => string
  edit: (update: (content: StepContent) => StepContent) => void
}) {
  const t = useT("stepEditor")
  const [removing, setRemoving] = useState<Block | null>(null)

  function replace(block: Block) {
    edit((current) => updateBlock(current, block.id, () => block))
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {content.blocks.map((block, index) => (
          <BlockCard
            key={keyOf(block.id)}
            type={block.type}
            index={index}
            total={content.blocks.length}
            onMove={(direction) =>
              edit((current) => ({
                ...current,
                blocks: moveItem(current.blocks, index, direction === "up" ? index - 1 : index + 1),
              }))
            }
            onRemove={() => setRemoving(block)}
          >
            {block.type === "text" ? (
              <MarkdownEditor
                value={block.markdown}
                onChange={(markdown) => replace({ ...block, markdown })}
                label={t("markdownLabel", { number: index + 1 })}
              />
            ) : null}
            {block.type === "video" ? (
              <VideoBlockEditor block={block} onChange={replace} courseId={courseId} stepId={stepId} />
            ) : null}
            {block.type === "interactive_video" ? (
              <InteractiveVideoBlockEditor
                block={block}
                onChange={replace}
                keyOf={keyOf}
                courseId={courseId}
                stepId={stepId}
              />
            ) : null}
            {block.type === "h5p" ? (
              <H5PBlockEditor block={block} onChange={replace} courseId={courseId} stepId={stepId} />
            ) : null}
            {block.type === "test" ? <TestBlockEditor block={block} keyOf={keyOf} onChange={replace} /> : null}
            {block.type === "flashcards" ? (
              <FlashcardsBlockEditor block={block} keyOf={keyOf} onChange={replace} />
            ) : null}
          </BlockCard>
        ))}
      </div>
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={t("removeBlockTitle")}
        confirmLabel={t("removeBlockConfirm")}
        destructive
        onConfirm={() => {
          if (removing)
            edit((current) => ({
              ...current,
              blocks: current.blocks.filter((block) => block.id !== removing.id),
            }))
          setRemoving(null)
        }}
      />
    </>
  )
}
