"use client"

import type { ArtifactKind, ApplyResult, CoursePlan, LessonDraft } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { IconArrowBigDownLine } from "@ihsp/ui"
import { useState } from "react"
import { ToolbarButton } from "../toolbar-button"
import { ApplyDialog } from "./apply-dialog"
import { editorHrefFor, useCourseContext } from "./use-course-context"

export type ApplyButtonProps = {
  notebookId: string
  artifact: { id: string; kind: ArtifactKind; title: string }
  plan?: CoursePlan
  draft?: LessonDraft
  defaultStepId?: string | null
  disabled?: boolean
  onApplied?: (result: ApplyResult) => void
}

/** "Apply to course": opens the Apply dialog for a course output. Only editors of the course see it. */
export function ApplyButton({
  notebookId,
  artifact,
  plan,
  draft,
  defaultStepId,
  disabled,
  onApplied,
}: ApplyButtonProps) {
  const t = useT("notebooks")
  const { courseId, canWrite } = useCourseContext(notebookId)
  const [open, setOpen] = useState(false)
  if (courseId === null || !canWrite) return null
  return (
    <>
      <ToolbarButton
        icon={IconArrowBigDownLine}
        label={t(artifact.kind === "course_plan" ? "course.apply.buttonPlan" : "course.apply.buttonStep")}
        disabled={disabled}
        onClick={() => setOpen(true)}
      />
      <ApplyDialog
        notebookId={notebookId}
        courseId={courseId}
        artifact={artifact}
        {...(plan ? { plan } : {})}
        {...(draft ? { draft } : {})}
        {...(defaultStepId !== undefined ? { defaultStepId } : {})}
        open={open}
        onOpenChange={setOpen}
        {...(onApplied ? { onApplied } : {})}
        editorHref={(result) => editorHrefFor(courseId, result.step_id)}
      />
    </>
  )
}
