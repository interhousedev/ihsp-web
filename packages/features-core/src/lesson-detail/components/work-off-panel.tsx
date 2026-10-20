"use client"

import type { WorkOffItem, WorkOffTemplate } from "@ihsp/api"
import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Badge, Button, ConfirmDialog, Icons } from "@ihsp/ui"
import { useState } from "react"
import { toast } from "sonner"
import { useWorkOffActions } from "../hooks/use-work-off-actions"
import { draftText, type WorkOffDraft } from "../utils/work-offs"
import { WorkOffDialog } from "./work-off-dialog"

/**
 * The work-off task under the row of an absent student (WO-3): the choice made in this form (saved with the
 * attendance), else the saved work-off with "Mark done" / "Reopen", edit and delete, else a button to add one.
 */
export function WorkOffPanel({
  lessonId,
  name,
  draft,
  saved,
  templates,
  readOnly,
  onEditDraft,
}: {
  lessonId: string
  name: string
  draft: WorkOffDraft | undefined
  saved: WorkOffItem | undefined
  templates: readonly WorkOffTemplate[]
  readOnly: boolean
  onEditDraft: () => void
}) {
  const t = useT("lessonDetail.workOff")
  const tc = useT("common")
  const f = useFormatters()
  const errorMessage = useErrorMessage()
  const { patch, remove } = useWorkOffActions(lessonId)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (draft) {
    const text = draftText(draft, templates)
    return (
      <div className="flex items-start justify-between gap-2 text-sm">
        <p className="min-w-0 flex-1">
          {text === "" ? (
            <span className="text-muted-foreground">{t("none")}</span>
          ) : (
            <>
              <span className="line-clamp-2 break-words" title={text}>
                {t("label", { text })}
              </span>
              {draft.due_date ? (
                <span className="text-muted-foreground text-xs">{t("due", { date: f.date(draft.due_date) })}</span>
              ) : null}
            </>
          )}
        </p>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("editFor", { name })}
          title={t("editFor", { name })}
          onClick={onEditDraft}
        >
          <Icons.edit aria-hidden />
        </Button>
      </div>
    )
  }

  if (!saved) {
    if (readOnly) return null
    return (
      <Button variant="outline" size="sm" className="w-fit" onClick={onEditDraft}>
        <Icons.add aria-hidden />
        {t("add")}
      </Button>
    )
  }

  const done = saved.status === "done"

  function toggleDone(item: WorkOffItem) {
    patch.mutate({ id: item.id, body: { status: item.status === "done" ? "assigned" : "done" } })
  }

  async function confirmDelete(item: WorkOffItem) {
    try {
      await remove.mutateAsync(item.id)
      toast.success(t("deleted"))
      setDeleting(false)
    } catch {
      // The error is shown inside the dialog.
    }
  }

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1">
          <span
            className={done ? "text-muted-foreground line-clamp-2 break-words" : "line-clamp-2 break-words"}
            title={saved.text}
          >
            {t("label", { text: saved.text })}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
            {done ? <Badge variant="secondary">{t("done")}</Badge> : null}
            {saved.due_date ? (
              <span className="text-muted-foreground text-xs">{t("due", { date: f.date(saved.due_date) })}</span>
            ) : null}
          </span>
        </p>
        {!readOnly ? (
          <div className="flex shrink-0 items-center">
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("editFor", { name })}
              title={t("editFor", { name })}
              onClick={() => setEditing(true)}
            >
              <Icons.edit aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("deleteFor", { name })}
              title={t("deleteFor", { name })}
              onClick={() => setDeleting(true)}
            >
              <Icons.trash aria-hidden />
            </Button>
          </div>
        ) : null}
      </div>
      {!readOnly ? (
        <Button
          variant="outline"
          size="sm"
          className="w-fit"
          disabled={patch.isPending}
          onClick={() => toggleDone(saved)}
        >
          {done ? t("reopen") : t("markDone")}
        </Button>
      ) : null}
      {patch.isError && !editing ? (
        <p role="alert" className="text-destructive text-xs">
          {errorMessage(patch.error)}
        </p>
      ) : null}
      {editing ? (
        <WorkOffDialog
          title={t("editTitle")}
          mode="edit"
          templates={[]}
          initial={{ template_id: null, text: saved.text, due_date: saved.due_date }}
          requireText
          pending={patch.isPending}
          error={patch.isError ? errorMessage(patch.error) : null}
          onClose={() => {
            setEditing(false)
            patch.reset()
          }}
          onSubmit={(next) =>
            patch.mutate(
              { id: saved.id, body: { text: next.text.trim(), due_date: next.due_date } },
              {
                onSuccess: () => {
                  toast.success(t("saved"))
                  setEditing(false)
                },
              },
            )
          }
        />
      ) : null}
      <ConfirmDialog
        open={deleting}
        onOpenChange={(open) => {
          setDeleting(open)
          if (!open) remove.reset()
        }}
        title={t("deleteTitle")}
        destructive
        confirmLabel={tc("delete")}
        loading={remove.isPending}
        onConfirm={() => confirmDelete(saved)}
      >
        {remove.isError ? (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage(remove.error)}
          </p>
        ) : null}
      </ConfirmDialog>
    </div>
  )
}
