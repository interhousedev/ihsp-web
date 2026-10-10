"use client"

import { getLmsCourseDraftQuery, getLmsStepDraftQuery, type StepDraft } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useQuery } from "@tanstack/react-query"
import { EditorFrame } from "../../editor/components/editor-frame"
import { QueryState } from "../../shared/components/query-state"
import { can } from "../../shared/utils/permissions"
import { StepEditorBody } from "./step-editor-body"

/** "Step 2 · Title": the step's number in the course outline plus its title (just the number when the title is one). */
export function stepHeading(
  draft: StepDraft,
  outline: { steps: { step_id: string }[] }[] | undefined,
  label: (number: number) => string,
  untitled: string,
): string {
  const flat = (outline ?? []).flatMap((section) => section.steps)
  const index = flat.findIndex((step) => step.step_id === draft.step_id)
  const title = draft.content.title.trim()
  if (index < 0) return title || untitled
  const head = label(index + 1)
  return title && !/^\d+$/.test(title) ? `${head} · ${title}` : head
}

function StepEditorFrame({ data, autosaveMs }: { data: StepDraft; autosaveMs?: number }) {
  const t = useT("stepEditor")
  const course = useQuery({ ...getLmsCourseDraftQuery(data.course_id), retry: false })
  const title = stepHeading(data, course.data?.outline, (number) => t("stepNumber", { number }), t("untitled"))
  return (
    <EditorFrame courseId={data.course_id} current="outline" title={title} requires={["edit", "view_drafts"]}>
      {(permissions) => (
        <StepEditorBody key={data.step_id} draft={data} canEdit={can(permissions, "edit")} autosaveMs={autosaveMs} />
      )}
    </EditorFrame>
  )
}

/** `/edit/step/?id=`: loads the step draft, then checks the course permissions and shows the editor. */
export function StepEditorPage({ stepId, autosaveMs }: { stepId: string; autosaveMs?: number }) {
  const t = useT("stepEditor")
  const draft = useQuery({ ...getLmsStepDraftQuery(stepId), staleTime: 0, gcTime: 0 })
  return (
    <QueryState query={draft} rows={4}>
      {(data) => <StepEditorFrame data={data} autosaveMs={autosaveMs} />}
    </QueryState>
  )
}
