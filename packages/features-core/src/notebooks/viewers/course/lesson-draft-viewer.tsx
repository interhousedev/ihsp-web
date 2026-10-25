"use client"

import type { LessonDraft, LessonDraftContent } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Input } from "@ihsp/ui"
import { useId, useMemo, useState } from "react"
import type { ViewerProps } from "../viewer-props"
import { ApplyButton } from "./apply-button"
import { BlockList } from "./block-preview"
import { toDisplayBlocks } from "./blocks"
import { useCourseContext } from "./use-course-context"

/** The lesson the model wrote for a step: the title (editable before Apply) and the blocks as the student will see them. */
export function LessonDraftViewer({ notebookId, artifact }: ViewerProps<"lesson_draft">) {
  const t = useT("notebooks")
  const content = artifact.content as LessonDraftContent
  const { canWrite } = useCourseContext(notebookId)
  const [title, setTitle] = useState(content.title)
  const titleId = useId()
  const draft = useMemo<LessonDraft>(
    () => ({ title: title.trim() === "" ? content.title : title.trim(), blocks: content.blocks }),
    [title, content],
  )
  const blocks = useMemo(() => toDisplayBlocks(content.blocks), [content.blocks])

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <ApplyButton
          notebookId={notebookId}
          artifact={{ id: artifact.id, kind: "lesson_draft", title: artifact.title }}
          draft={draft}
          defaultStepId={content.step_id ?? null}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={titleId} className="text-muted-foreground text-xs font-medium">
          {t("course.lesson.title")}
        </label>
        <Input
          id={titleId}
          value={title}
          maxLength={200}
          disabled={!canWrite}
          className="min-h-11 text-base font-semibold md:min-h-9"
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>
      <BlockList blocks={blocks} />
    </div>
  )
}
