"use client"

import type { SuggestionDetail } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Badge, Button, formatBytes, safeHttpUrl } from "@ihsp/ui"
import { IconCheck, IconX } from "@ihsp/ui"
import { useState } from "react"
import { ReasonDialog } from "../shared/reason-dialog"

/**
 * A new book started from a suggestion (`?suggestion=`): what the suggester sent (file, link, note) and the two
 * decisions. Approve saves the edited form as a book, hands the suggester's file over to it and tells them; Decline
 * asks for a reason the suggester sees, and their files are deleted after 30 days.
 */
export function SuggestionReviewPanel({
  suggestion,
  blocked,
  approving,
  declining,
  declineError,
  onApprove,
  onDecline,
}: {
  suggestion: SuggestionDetail
  blocked: boolean
  approving: boolean
  declining: boolean
  declineError: unknown
  onApprove: () => void
  onDecline: (reason: string) => void
}) {
  const t = useT("library.manage.editor.suggestion")
  const errorMessage = useErrorMessage()
  const [declineOpen, setDeclineOpen] = useState(false)
  const link = safeHttpUrl(suggestion.url)
  const pending = suggestion.status === "new"
  return (
    <section aria-labelledby="book-suggestion-title" className="bg-muted/40 flex flex-col gap-3 rounded-xl border p-4">
      <h2 id="book-suggestion-title" className="flex items-center gap-2 text-lg font-semibold">
        {t("title")}
        <Badge variant={pending ? "secondary" : "outline"}>{t(`status.${suggestion.status}`)}</Badge>
      </h2>
      <p className="text-muted-foreground text-sm">{t("intro")}</p>
      {suggestion.file ? (
        <p className="text-sm">
          <span className="text-muted-foreground">{t("file")}: </span>
          {suggestion.file.name} ({formatBytes(suggestion.file.byte_size)})
        </p>
      ) : null}
      {link ? (
        <p className="text-sm break-all">
          <span className="text-muted-foreground">{t("link")}: </span>
          <a href={link} target="_blank" rel="noopener noreferrer" className="underline">
            {link}
          </a>
        </p>
      ) : null}
      {suggestion.note ? (
        <p className="text-sm break-words whitespace-pre-line">
          <span className="text-muted-foreground">{t("note")}: </span>
          {suggestion.note}
        </p>
      ) : null}
      {pending ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="min-h-11 md:min-h-8"
            disabled={blocked || approving || declining}
            onClick={onApprove}
          >
            <IconCheck aria-hidden />
            {t("approve")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 md:min-h-8"
            disabled={approving || declining}
            onClick={() => setDeclineOpen(true)}
          >
            <IconX aria-hidden />
            {t("decline")}
          </Button>
        </div>
      ) : null}
      {declineError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(declineError)}
        </p>
      ) : null}
      <ReasonDialog
        open={declineOpen}
        onOpenChange={setDeclineOpen}
        title={t("declineTitle")}
        description={t("declineDescription")}
        confirmLabel={t("decline")}
        destructive
        pending={declining}
        onSubmit={(reason) => {
          onDecline(reason)
          setDeclineOpen(false)
        }}
      />
    </section>
  )
}
