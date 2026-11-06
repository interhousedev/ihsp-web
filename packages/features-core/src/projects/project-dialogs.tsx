"use client"

import type { ProjectResponse } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, ConfirmDialog, Input, Label, ResponsiveDialog } from "@ihsp/ui"
import { useEffect, useId, useState, type FormEvent } from "react"
import { normalizeProjectName } from "./project-name"

type NameDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  submitLabel: string
  initialName: string
  pending: boolean
  error: unknown
  onSubmit: (name: string) => void
}

/** Name field shared by "New project" and "Rename project". The name is trimmed before it is sent. */
function NameDialog({
  open,
  onOpenChange,
  title,
  submitLabel,
  initialName,
  pending,
  error,
  onSubmit,
}: NameDialogProps) {
  const t = useT("assistant.projects")
  const errorMessage = useErrorMessage()
  const inputId = useId()
  const [name, setName] = useState(initialName)

  useEffect(() => {
    if (open) setName(initialName)
  }, [open, initialName])

  const normalized = normalizeProjectName(name)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (normalized === null || pending) return
    onSubmit(normalized)
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      size="sm"
      onSubmit={submit}
      footer={
        <Button type="submit" disabled={normalized === null || pending} className="min-h-11 md:min-h-9">
          {submitLabel}
        </Button>
      }
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor={inputId}>{t("nameLabel")}</Label>
        <Input id={inputId} value={name} autoFocus maxLength={120} onChange={(event) => setName(event.target.value)} />
        {error ? (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage(error)}
          </p>
        ) : null}
      </div>
    </ResponsiveDialog>
  )
}

type CreateProjectDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  pending: boolean
  error: unknown
  onCreate: (name: string) => void
}

/** "New project": one name field. */
export function CreateProjectDialog(props: CreateProjectDialogProps) {
  const t = useT("assistant.projects")
  return (
    <NameDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={t("newTitle")}
      submitLabel={t("create")}
      initialName=""
      pending={props.pending}
      error={props.error}
      onSubmit={props.onCreate}
    />
  )
}

type RenameProjectDialogProps = {
  project: ProjectResponse
  open: boolean
  onOpenChange: (open: boolean) => void
  pending: boolean
  error: unknown
  onRename: (name: string) => void
}

export function RenameProjectDialog(props: RenameProjectDialogProps) {
  const t = useT("assistant.projects")
  return (
    <NameDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={t("renameTitle")}
      submitLabel={t("save")}
      initialName={props.project.name}
      pending={props.pending}
      error={props.error}
      onSubmit={props.onRename}
    />
  )
}

type DeleteProjectDialogProps = {
  project: ProjectResponse
  open: boolean
  onOpenChange: (open: boolean) => void
  pending: boolean
  onConfirm: () => void
}

/** Confirmation before a project is removed; nothing is deleted until the student confirms. */
export function DeleteProjectDialog({ project, open, onOpenChange, pending, onConfirm }: DeleteProjectDialogProps) {
  const t = useT("assistant.projects")
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("deleteTitle")}
      description={t("deleteDescription", { name: project.name })}
      confirmLabel={t("deleteConfirm")}
      cancelLabel={t("cancel")}
      destructive
      loading={pending}
      onConfirm={onConfirm}
    />
  )
}
