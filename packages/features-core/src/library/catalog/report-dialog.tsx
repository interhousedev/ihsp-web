"use client"

import { postItemReport, type LibraryReportReason } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Textarea,
} from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import { useLibraryAccess } from "../hooks/use-library-access"
import { SignInLink } from "./sign-in-link"

const REASONS: readonly LibraryReportReason[] = [
  "wrong_content",
  "copyright",
  "inappropriate",
  "personal_data",
  "exam_leak",
  "spam",
  "other",
]
const MAX_TEXT = 500

/** Report an item to the librarians: a reason, optional details up to 500 characters. Signed-in users only. */
export function ReportDialog({
  itemId,
  open,
  onOpenChange,
}: {
  itemId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useT("library.report")
  const errorMessage = useErrorMessage()
  const { signedIn } = useLibraryAccess()
  const [reason, setReason] = useState<LibraryReportReason | null>(null)
  const [text, setText] = useState("")

  const send = useMutation({
    mutationFn: () => {
      const details = text.trim()
      return postItemReport(itemId, { reason: reason!, ...(details ? { text: details } : {}) })
    },
    onSuccess: () => {
      toast.success(t("thanks"))
      setReason(null)
      setText("")
      onOpenChange(false)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        {signedIn ? (
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              if (reason) send.mutate()
            }}
          >
            <fieldset className="flex flex-col gap-1">
              <legend className="mb-1 text-sm font-medium">{t("reasonLabel")}</legend>
              {REASONS.map((value) => (
                <Label key={value} className="min-h-11 cursor-pointer gap-3 rounded-md px-2 font-normal md:min-h-9">
                  <input
                    type="radio"
                    name="report-reason"
                    value={value}
                    checked={reason === value}
                    onChange={() => setReason(value)}
                    className="size-4"
                  />
                  {t(`reason.${value}`)}
                </Label>
              ))}
            </fieldset>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="report-text">{t("textLabel")}</Label>
              <Textarea
                id="report-text"
                value={text}
                maxLength={MAX_TEXT}
                rows={3}
                onChange={(event) => setText(event.target.value)}
              />
              <p className="text-muted-foreground text-xs">{t("textHint", { count: text.length })}</p>
            </div>
            {send.isError ? (
              <p role="alert" className="text-destructive text-sm">
                {errorMessage(send.error)}
              </p>
            ) : null}
            <DialogFooter>
              <Button type="submit" className="min-h-11 md:min-h-8" disabled={!reason || send.isPending}>
                {t("send")}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm">{t("signIn")}</p>
            <SignInLink />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
