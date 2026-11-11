"use client"

import type { HomeworkSubmissionSummary } from "@ihsp/api"
import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Badge, Button, FileUploader, Textarea } from "@ihsp/ui"
import { useId, useState } from "react"
import { useSubmitHomework, useWithdrawHomework } from "../hooks/use-homework"

export const SUBMISSION_MAX_FILES = 10
export const SUBMISSION_COMMENT_MAX_LENGTH = 1000
const SUBMISSION_MAX_BYTES = 20 * 1024 * 1024
const SUBMISSION_ACCEPT = {
  "application/pdf": [".pdf"],
  "image/*": [],
  "text/plain": [".txt", ".md"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
}

/**
 * Handing the homework in: the status of the submission (submitted or late, how many files, when) with Replace and
 * Withdraw, or the "Hand in" form with up to 10 files and an optional comment. Saving replaces the earlier submission.
 */
export function HomeworkSubmissionPanel({
  lessonId,
  submission,
}: {
  lessonId: string
  submission: HomeworkSubmissionSummary | null
}) {
  const t = useT("homework.submission")
  const f = useFormatters()
  const errorMessage = useErrorMessage()
  const submit = useSubmitHomework()
  const withdraw = useWithdrawHomework()
  const commentId = useId()
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [comment, setComment] = useState("")

  function close() {
    setOpen(false)
    setFiles([])
    setComment("")
    submit.reset()
  }

  function send() {
    const text = comment.trim()
    submit.mutate({ lessonId, files, comment: text === "" ? null : text }, { onSuccess: close })
  }

  const error = submit.isError ? submit.error : withdraw.isError ? withdraw.error : null

  return (
    <div className="flex flex-col gap-2" data-testid="homework-submission">
      {submission ? (
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={submission.status === "late" ? "destructive" : "secondary"}>
            {t(submission.status === "late" ? "late" : "submitted")}
          </Badge>
          <span className="text-muted-foreground text-xs">
            {t("summary", { count: submission.file_count, time: f.dateTime(submission.submitted_at) })}
          </span>
          {open ? null : (
            <>
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
                {t("replace")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={withdraw.isPending}
                onClick={() => withdraw.mutate({ lessonId })}
              >
                {t("withdraw")}
              </Button>
            </>
          )}
        </div>
      ) : open ? null : (
        <div>
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
            {t("handIn")}
          </Button>
        </div>
      )}
      {open ? (
        <div className="flex flex-col gap-2">
          <FileUploader
            value={files}
            onValueChange={setFiles}
            accept={SUBMISSION_ACCEPT}
            maxFiles={SUBMISSION_MAX_FILES}
            maxSize={SUBMISSION_MAX_BYTES}
            multiple
            disabled={submit.isPending}
            className="h-28"
          />
          <label htmlFor={commentId} className="text-muted-foreground text-xs">
            {t("comment")}
          </label>
          <Textarea
            id={commentId}
            value={comment}
            maxLength={SUBMISSION_COMMENT_MAX_LENGTH}
            rows={2}
            onChange={(event) => setComment(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" disabled={files.length === 0 || submit.isPending} onClick={send}>
              {submit.isPending ? t("sending") : t("send")}
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={submit.isPending} onClick={close}>
              {t("cancel")}
            </Button>
          </div>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(error)}
        </p>
      ) : null}
    </div>
  )
}
