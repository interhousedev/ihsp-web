"use client"

import type { WorkOffTemplate } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, ConfirmDialog, Icons, Label, RadioGroup, RadioGroupItem, StateView } from "@ihsp/ui"
import { useId, useState } from "react"
import { toast } from "sonner"
import { useWorkOffTemplates } from "../hooks/use-work-off-templates"
import { WorkOffTemplateDialog } from "./work-off-template-dialog"

const NO_DEFAULT = "none"

type Dialog =
  | { kind: "create" }
  | { kind: "edit"; template: WorkOffTemplate }
  | { kind: "delete"; template: WorkOffTemplate }

/**
 * The "Work-off tasks" settings (WO-1): the teacher's templates with add, edit and delete, and a radio that picks the
 * default one (or "No default"); the default is preselected when a student is marked absent.
 */
export function WorkOffTemplates() {
  const t = useT("settings.workOffs")
  const tc = useT("common")
  const errorMessage = useErrorMessage()
  const groupId = useId()
  const { query, create, update, remove } = useWorkOffTemplates()
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const templates = query.data ?? []
  const current = templates.find((item) => item.is_default)

  function close() {
    setDialog(null)
    create.reset()
    update.reset()
    remove.reset()
  }

  function pickDefault(value: string) {
    const target = value === NO_DEFAULT ? current : templates.find((item) => item.id === value)
    if (!target || (value !== NO_DEFAULT && target.is_default)) return
    update.mutate({ id: target.id, body: { text: target.text, is_default: value !== NO_DEFAULT } })
  }

  function save(text: string) {
    if (dialog?.kind === "edit") {
      update.mutate(
        { id: dialog.template.id, body: { text, is_default: dialog.template.is_default } },
        { onSuccess: saved },
      )
    } else {
      create.mutate({ text }, { onSuccess: saved })
    }
  }

  function saved() {
    toast.success(t("saved"))
    close()
  }

  async function confirmDelete(template: WorkOffTemplate) {
    try {
      await remove.mutateAsync(template.id)
      toast.success(t("deleted"))
      close()
    } catch {
      // The error is shown inside the dialog.
    }
  }

  if (query.isPending || query.isError) {
    return (
      <StateView
        state={query.isPending ? "loading" : "error"}
        error={query.error}
        onRetry={() => void query.refetch()}
      />
    )
  }

  const saving = dialog?.kind === "edit" ? update : create
  return (
    <div className="flex flex-col gap-3">
      {templates.length === 0 ? <p className="text-muted-foreground text-sm">{t("empty")}</p> : null}
      {templates.length > 0 ? (
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-sm font-medium">{t("defaultLabel")}</legend>
          <RadioGroup value={current?.id ?? NO_DEFAULT} onValueChange={pickDefault}>
            {templates.map((template) => (
              <div key={template.id} className="flex items-start gap-3 py-1">
                <RadioGroupItem value={template.id} id={`${groupId}-${template.id}`} className="mt-1" />
                <Label htmlFor={`${groupId}-${template.id}`} className="min-w-0 flex-1 font-normal break-words">
                  {template.text}
                </Label>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("editFor", { text: template.text })}
                  onClick={() => setDialog({ kind: "edit", template })}
                >
                  <Icons.edit aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("deleteFor", { text: template.text })}
                  onClick={() => setDialog({ kind: "delete", template })}
                >
                  <Icons.trash aria-hidden />
                </Button>
              </div>
            ))}
            <div className="flex min-h-11 items-start gap-3 py-1">
              <RadioGroupItem value={NO_DEFAULT} id={`${groupId}-${NO_DEFAULT}`} className="mt-1" />
              <Label htmlFor={`${groupId}-${NO_DEFAULT}`} className="font-normal">
                {t("noDefault")}
              </Label>
            </div>
          </RadioGroup>
        </fieldset>
      ) : null}
      {update.isError && dialog === null ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(update.error)}
        </p>
      ) : null}
      <Button
        variant="outline"
        className="min-h-11 w-full md:min-h-8 md:w-fit"
        onClick={() => setDialog({ kind: "create" })}
      >
        <Icons.add aria-hidden />
        {t("add")}
      </Button>
      {dialog?.kind === "create" || dialog?.kind === "edit" ? (
        <WorkOffTemplateDialog
          title={dialog.kind === "edit" ? t("editTitle") : t("addTitle")}
          initialText={dialog.kind === "edit" ? dialog.template.text : ""}
          pending={saving.isPending}
          error={saving.isError ? errorMessage(saving.error) : null}
          onSubmit={save}
          onClose={close}
        />
      ) : null}
      <ConfirmDialog
        open={dialog?.kind === "delete"}
        onOpenChange={(open) => !open && close()}
        title={t("deleteTitle")}
        destructive
        confirmLabel={tc("delete")}
        loading={remove.isPending}
        onConfirm={() => (dialog?.kind === "delete" ? confirmDelete(dialog.template) : undefined)}
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
