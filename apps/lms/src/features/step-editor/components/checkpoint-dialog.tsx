"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldLabel,
  Input,
  LoadingButton,
} from "@ihsp/ui"
import { useState, type FormEvent } from "react"

/** Names a checkpoint (LMS-12, UF-LMS-13): "before rewriting questions". */
export function CheckpointDialog({
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
  onCreate: (label: string) => void
}) {
  const t = useT("checkpoint")
  const tc = useT("common")
  const errorMessage = useErrorMessage()
  const [label, setLabel] = useState("")
  function submit(event: FormEvent) {
    event.preventDefault()
    if (label.trim()) onCreate(label.trim())
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="checkpoint-label">{t("label")}</FieldLabel>
            <Input
              id="checkpoint-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              maxLength={100}
              placeholder={t("placeholder")}
              className="h-11 md:h-8"
            />
          </Field>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage(error)}</AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="min-h-11 md:min-h-8">
              {tc("cancel")}
            </Button>
            <LoadingButton
              type="submit"
              disabled={label.trim() === ""}
              className="min-h-11 md:min-h-8"
              loading={pending}
            >
              {t("save")}
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
