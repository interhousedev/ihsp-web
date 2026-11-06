"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Button, Field, FieldLabel, Input, LoadingButton, ResponsiveDialog } from "@ihsp/ui"
import { useState, type FormEvent } from "react"

/** Asks for the title of a new step; the caller creates it and opens the step editor. */
export function AddStepDialog({
  open,
  onOpenChange,
  pending,
  error,
  onCreate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  pending: boolean
  error: unknown
  onCreate: (title: string) => void
}) {
  const t = useT("outline")
  const tc = useT("common")
  const errorMessage = useErrorMessage()
  const [title, setTitle] = useState("")

  function submit(event: FormEvent) {
    event.preventDefault()
    if (title.trim()) onCreate(title.trim())
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("addStepTitle")}
      size="sm"
      onSubmit={submit}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="min-h-11 md:min-h-8">
            {tc("cancel")}
          </Button>
          <LoadingButton type="submit" disabled={title.trim() === ""} className="min-h-11 md:min-h-8" loading={pending}>
            {t("addStep")}
          </LoadingButton>
        </>
      }
    >
      <Field>
        <FieldLabel htmlFor="new-step-title">{t("stepTitle")}</FieldLabel>
        <Input
          id="new-step-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="h-11 md:h-8"
          maxLength={200}
        />
      </Field>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(error)}</AlertDescription>
        </Alert>
      ) : null}
    </ResponsiveDialog>
  )
}
