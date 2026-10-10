"use client"

import { useT } from "@ihsp/i18n"
import { LinkButton } from "../../shared/components/link-button"
import { QueryState } from "../../shared/components/query-state"
import { hrefs } from "../../shared/utils/hrefs"
import { can } from "../../shared/utils/permissions"
import { useCourseDraft } from "../hooks/use-course-draft"
import { useMetaEditor } from "../hooks/use-meta-editor"
import { CourseSettingsCard } from "./course-settings-card"
import { EditorFrame } from "./editor-frame"
import { MetaForm } from "./meta-form"
import { OutlineEditor } from "./outline-editor"
import { SaveIndicator } from "./save-indicator"
import type { CourseDraft } from "@ihsp/api"

function EditorBody({ draft, autosaveMs }: { draft: CourseDraft; autosaveMs?: number }) {
  const t = useT("editor")
  const canEdit = can(draft.my_permissions, "edit")
  const editor = useMetaEditor(draft, { canEdit, autosaveMs })
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        {canEdit ? (
          <SaveIndicator status={editor.status} draft />
        ) : (
          <p className="text-muted-foreground text-sm">{t("readOnly")}</p>
        )}
        {draft.pending_count > 0 ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm">{t("unpublished", { count: draft.pending_count })}</span>
            {can(draft.my_permissions, "publish") ? (
              <LinkButton href={hrefs.publish(draft.id)} variant="outline" className="min-h-11 md:min-h-8">
                {t("publishAction")}
              </LinkButton>
            ) : null}
          </div>
        ) : null}
      </div>
      <MetaForm draft={draft} editor={editor} canEdit={canEdit} />
      <section aria-labelledby="editor-outline" className="flex flex-col gap-3">
        <h2 id="editor-outline" className="text-lg font-semibold">
          {t("outline")}
        </h2>
        <OutlineEditor draft={draft} canEdit={canEdit} />
      </section>
      <CourseSettingsCard draft={draft} canEdit={canEdit} />
    </div>
  )
}

/** `/edit/?id=`: the course editor (UF-LMS-08): save state, meta, outline with drag and drop, settings. */
export function CourseEditorPage({ courseId, autosaveMs }: { courseId: string; autosaveMs?: number }) {
  const t = useT("editor")
  const draft = useCourseDraft(courseId)
  return (
    <EditorFrame courseId={courseId} current="outline" title={t("title")} requires={["edit", "view_drafts"]}>
      {() => (
        <QueryState query={draft} rows={4}>
          {(data) => <EditorBody draft={data} autosaveMs={autosaveMs} />}
        </QueryState>
      )}
    </EditorFrame>
  )
}
