"use client"

import type { ChatItem } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Label } from "@ihsp/ui"
import { useEffect, useId, useState } from "react"

const MAX_TITLE_LENGTH = 120

type RenameChatDialogProps = {
  chat: ChatItem | null
  pending: boolean
  error: unknown
  onClose: () => void
  onSave: (chat: ChatItem, title: string) => void
}

export function RenameChatDialog({ chat, pending, error, onClose, onSave }: RenameChatDialogProps) {
  const t = useT("assistant.rename")
  const errorMessage = useErrorMessage()
  const inputId = useId()
  const [title, setTitle] = useState("")

  useEffect(() => {
    setTitle(chat?.title ?? "")
  }, [chat])

  const trimmed = title.trim()

  return (
    <Dialog
      open={chat !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (chat && trimmed) onSave(chat, trimmed)
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1">
            <Label htmlFor={inputId}>{t("label")}</Label>
            <Input
              id={inputId}
              value={title}
              maxLength={MAX_TITLE_LENGTH}
              className="min-h-11"
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          {error ? (
            <p role="alert" className="text-destructive text-sm">
              {errorMessage(error)}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" className="min-h-11" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" className="min-h-11" disabled={pending || trimmed === ""}>
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
