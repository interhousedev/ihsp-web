"use client"

import { postSuggestion } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Button,
  Dialog,
  DialogContent,
    DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
} from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { useId, useState } from "react"
import { toast } from "sonner"

const TITLE_MAX = 200
const NOTE_MAX = 500

/** An address a librarian can open: empty is fine (the link is optional), otherwise it must be http or https. */
export function isSuggestionLink(value: string): boolean {
  const text = value.trim()
  if (text === "") return true
  try {
    const url = new URL(text)
    return url.protocol === "https:" || url.protocol === "http:"
  } catch {
    return false
  }
}

/** "Suggest a book": a title, an optional link and a note go to the librarians' queue (`POST /library/suggestions`). */
export function SuggestDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT("library.upload.suggest")
  const errorMessage = useErrorMessage()
  const ids = { title: useId(), url: useId(), note: useId() }
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [note, setNote] = useState("")
  const [showProblems, setShowProblems] = useState(false)

  const send = useMutation({
    mutationFn: () =>
      postSuggestion({
        title: title.trim(),
        ...(url.trim() ? { url: url.trim() } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      }),
    onSuccess: () => {
      toast.success(t("thanks"))
      setTitle("")
      setUrl("")
      setNote("")
      setShowProblems(false)
      onOpenChange(false)
    },
  })

  const titleMissing = title.trim() === ""
  const linkInvalid = !isSuggestionLink(url)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            setShowProblems(true)
            if (!titleMissing && !linkInvalid) send.mutate()
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={ids.title}>{t("titleLabel")}</Label>
            <Input
              id={ids.title}
              value={title}
              maxLength={TITLE_MAX}
              required
              aria-invalid={showProblems && titleMissing}
              aria-describedby={showProblems && titleMissing ? `${ids.title}-error` : undefined}
              onChange={(event) => setTitle(event.target.value)}
            />
            {showProblems && titleMissing ? (
              <p id={`${ids.title}-error`} role="alert" className="text-destructive text-sm">
                {t("titleRequired")}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={ids.url}>{t("urlLabel")}</Label>
            <Input
              id={ids.url}
              type="url"
              inputMode="url"
              value={url}
              placeholder="https://"
              aria-invalid={showProblems && linkInvalid}
              aria-describedby={showProblems && linkInvalid ? `${ids.url}-error` : undefined}
              onChange={(event) => setUrl(event.target.value)}
            />
            {showProblems && linkInvalid ? (
              <p id={`${ids.url}-error`} role="alert" className="text-destructive text-sm">
                {t("urlInvalid")}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={ids.note}>{t("noteLabel")}</Label>
            <Textarea
              id={ids.note}
              value={note}
              rows={3}
              maxLength={NOTE_MAX}
              onChange={(e) => setNote(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">{t("noteHint", { count: note.length, max: NOTE_MAX })}</p>
          </div>
          {send.isError ? (
            <p role="alert" className="text-destructive text-sm">
              {errorMessage(send.error)}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="submit" className="min-h-11 md:min-h-8" disabled={send.isPending}>
              {t("send")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
