"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons, Input, LoadingButton, ResponsiveDialog } from "@ihsp/ui"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { useRequestTranscript } from "../api"

/** POST /transcripts with an optional destination note. */
export function RequestDialog() {
  const t = useT("transcripts")
  const errorMessage = useErrorMessage()
  const request = useRequestTranscript()
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState("")

  async function submit(event: FormEvent) {
    event.preventDefault()
    try {
      await request.mutateAsync(note.trim())
      toast.success(t("requested"))
      setOpen(false)
      setNote("")
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Icons.plusCircle data-icon="inline-start" aria-hidden />
        {t("request")}
      </Button>
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title={t("requestTitle")}
        onSubmit={submit}
        footer={
          <LoadingButton type="submit" loading={request.isPending}>
            {t("requestSubmit")}
          </LoadingButton>
        }
      >
        <label className="flex flex-col gap-1 text-sm">
          {t("destinationLabel")}
          <Input value={note} maxLength={200} onChange={(event) => setNote(event.target.value)} />
        </label>
      </ResponsiveDialog>
    </>
  )
}
