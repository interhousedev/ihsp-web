"use client"

import { isApiError, postPublicReports, type ReportReason } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Button, Dropdown, LoadingButton, Textarea } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { useId, useState } from "react"

const REASONS: readonly ReportReason[] = ["phishing", "malware", "personal_data", "offensive", "other"]
const COMMENT_MAX = 500

/** SL-9: anyone with the link can report it. The form is hidden behind a button, the rate limit answers `429`. */
export function ReportForm({ slug }: { slug: string }) {
  const t = useT("share.report")
  const errorMessage = useErrorMessage()
  const reasonId = useId()
  const commentId = useId()
  const [open, setOpen] = useState(false)
  // No reason is chosen until the user picks one, so a stray tap cannot file "Phishing or fake".
  const [reason, setReason] = useState<ReportReason | "">("")
  const [comment, setComment] = useState("")
  const report = useMutation({
    mutationFn: (chosen: ReportReason) =>
      postPublicReports({
        slug,
        reason: chosen,
        comment: comment.trim() === "" ? undefined : comment.trim(),
      }),
  })

  if (report.isSuccess) {
    return (
      <Alert role="status">
        <AlertDescription>{t("success")}</AlertDescription>
      </Alert>
    )
  }

  if (!open) {
    return (
      <Button variant="ghost" className="min-h-11 self-start" onClick={() => setOpen(true)}>
        {t("open")}
      </Button>
    )
  }

  return (
    <form
      className="bg-card flex flex-col gap-4 rounded-xl border p-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (reason !== "") report.mutate(reason)
      }}
    >
      <h2 className="text-base font-semibold">{t("title")}</h2>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={reasonId} className="text-sm font-medium">
          {t("reason")}
        </label>
        <Dropdown
          id={reasonId}
          value={reason}
          required
          className="min-h-11 w-full"
          placeholder={t("reasonPlaceholder")}
          onValueChange={(next) => setReason(next as ReportReason | "")}
          options={REASONS.map((value) => ({ value, label: t(`reasons.${value}`) }))}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={commentId} className="text-sm font-medium">
          {t("comment")}
        </label>
        <Textarea
          id={commentId}
          value={comment}
          maxLength={COMMENT_MAX}
          rows={3}
          onChange={(event) => setComment(event.target.value)}
        />
      </div>
      {report.isError ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{isApiError(report.error) ? errorMessage(report.error) : t("failed")}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" className="min-h-11" onClick={() => setOpen(false)}>
          {t("cancel")}
        </Button>
        <LoadingButton
          type="submit"
          className="min-h-11"
          disabled={reason === ""}
          loading={report.isPending}
          loadingLabel={t("sending")}
        >
          {t("submit")}
        </LoadingButton>
      </div>
    </form>
  )
}
