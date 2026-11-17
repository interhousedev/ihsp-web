"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, ResponsiveDialog, Textarea } from "@ihsp/ui"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useDefaultPrompt, useSaveDefaultPrompt } from "../hooks"

const MATERIALS = ["site", "deadlines", "costs", "requirements"] as const

/** The one prompt that runs when a university chat opens, and the materials the research covers by default. */
export function DefaultPromptDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT("uniChat")
  const errorMessage = useErrorMessage()
  const saved = useDefaultPrompt(open)
  const save = useSaveDefaultPrompt()
  const [text, setText] = useState("")
  useEffect(() => {
    if (open && saved.data) setText(saved.data.prompt ?? "")
  }, [open, saved.data])

  const submit = () =>
    save.mutate(text.trim(), {
      onSuccess: () => {
        toast.success(t("prompt.saved"))
        onOpenChange(false)
      },
      onError: (error) => toast.error(errorMessage(error)),
    })

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("prompt.title")}
      onSubmit={submit}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {t("prompt.cancel")}
          </Button>
          <Button type="submit" disabled={save.isPending || saved.isPending}>
            {t("prompt.save")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="uni-chat-default-prompt" className="text-sm font-medium">
            {t("prompt.label")}
          </label>
          <Textarea
            id="uni-chat-default-prompt"
            value={text}
            rows={6}
            maxLength={2000}
            placeholder={t("prompt.placeholder")}
            onChange={(event) => setText(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">{t("prompt.materials")}</p>
          <ul className="text-muted-foreground flex list-disc flex-col gap-1 ps-5 text-sm">
            {MATERIALS.map((key) => (
              <li key={key}>{t(`prompt.material.${key}`)}</li>
            ))}
          </ul>
        </div>
      </div>
    </ResponsiveDialog>
  )
}
