"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import Link from "next/link"
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <SaveIndicator status={editor.status} pending={draft.pending_count} />
          {draft.pending_count > 0 && can(draft.my_permissions, "publish") ? (
            <Link href={hrefs.publish(draft.id)} className="text-primary text-sm underline-offset-2 hover:underline">
              {t("reviewPending")}
            </Link>
          ) : null}
        </div>
        {canEdit ? (
          <Button
            onClick={() => void editor.save()}
            disabled={!editor.dirty || editor.busy}
            className="min-h-11 md:min-h-8"
          >
            <Icons.check aria-hidden />
            {t("save")}
          </Button>
        ) : (
          <p className="text-muted-foreground text-sm">{t("readOnly")}</p>
        )}
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
