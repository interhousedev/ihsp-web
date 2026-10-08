"use client"

import { getLmsStepDraftQuery } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useQuery } from "@tanstack/react-query"
import { EditorFrame } from "../../editor/components/editor-frame"
import { QueryState } from "../../shared/components/query-state"
import { can } from "../../shared/utils/permissions"
import { StepEditorBody } from "./step-editor-body"

/** `/edit/step/?id=`: loads the step draft, then checks the course permissions and shows the editor. */
export function StepEditorPage({ stepId, autosaveMs }: { stepId: string; autosaveMs?: number }) {
  const t = useT("stepEditor")
  const draft = useQuery({ ...getLmsStepDraftQuery(stepId), staleTime: 0, gcTime: 0 })
  return (
    <QueryState query={draft} rows={4}>
      {(data) => (
        <EditorFrame
          courseId={data.course_id}
          current="outline"
          title={data.content.title || t("untitled")}
          requires={["edit", "view_drafts"]}
        >
          {(permissions) => (
            <StepEditorBody
              key={data.step_id}
              draft={data}
              canEdit={can(permissions, "edit")}
              autosaveMs={autosaveMs}
            />
          )}
        </EditorFrame>
      )}
    </QueryState>
  )
}
