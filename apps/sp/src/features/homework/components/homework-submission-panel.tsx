"use client"

import type { HomeworkSubmissionSummary } from "@ihsp/api"
import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Badge, Button, FileUploader, Textarea } from "@ihsp/ui"
import { useId, useState } from "react"
import { useHomeworkSubmission, useSubmitHomework, useWithdrawHomework } from "../hooks/use-homework"

export const SUBMISSION_MAX_FILES = 10
export const SUBMISSION_COMMENT_MAX_LENGTH = 1000
export const SUBMISSION_TEXT_MAX_LENGTH = 4000
const SUBMISSION_MAX_BYTES = 20 * 1024 * 1024
const SUBMISSION_ACCEPT = {
  "application/pdf": [".pdf"],
  "image/*": [],
  "text/plain": [".txt", ".md"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
}

/**
 * Handing the homework in: the status of the submission (submitted or late, how many files, when), the teacher's review
 * (grade or "returned" with a comment) with Replace and Withdraw, or the "Hand in" form with a text answer, up to 10 files
 * and an optional comment. Saving replaces the earlier submission. A graded submission is read-only; when the teacher
 * closed submissions nothing can be handed in.
 */
export function HomeworkSubmissionPanel({
  lessonId,
  submission,
  acceptsSubmissions,
}: {
  lessonId: string
  submission: HomeworkSubmissionSummary | null
  acceptsSubmissions: boolean
}) {
  const t = useT("homework.submission")
  const tr = useT("homeworkReview")
  const f = useFormatters()
  const errorMessage = useErrorMessage()
  const submit = useSubmitHomework()
  const withdraw = useWithdrawHomework()
  const answerId = useId()
  const commentId = useId()
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [answer, setAnswer] = useState("")
  const [comment, setComment] = useState("")

  const reviewStatus = submission?.review_status ?? "pending"
  const graded = reviewStatus === "graded"
  const reviewed = submission !== null && reviewStatus !== "pending"
  const detail = useHomeworkSubmission(lessonId, reviewed)
  const canChange = acceptsSubmissions && !graded

  function close() {
    setOpen(false)
    setFiles([])
    setAnswer("")
    setComment("")
    submit.reset()
  }

  function send() {
    const note = comment.trim()
    const text = answer.trim()
    submit.mutate(
      { lessonId, files, comment: note === "" ? null : note, text: text === "" ? null : text },
      { onSuccess: close },
    )
  }

  const error = submit.isError ? submit.error : withdraw.isError ? withdraw.error : null
  const teacherComment = reviewed ? (detail.data?.teacher_comment ?? null) : null

  return (
    <div className="flex flex-col gap-2" data-testid="homework-submission" data-review={reviewStatus}>
      {submission ? (
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={submission.status === "late" ? "destructive" : "secondary"}>
            {t(submission.status === "late" ? "late" : "submitted")}
          </Badge>
          {graded ? (
            <Badge>{tr("graded", { grade: submission.grade ?? "—" })}</Badge>
          ) : reviewStatus === "returned" ? (
            <Badge variant="destructive">{tr("returned")}</Badge>
          ) : (
            <Badge variant="outline">{tr("pending")}</Badge>
          )}
          <span className="text-muted-foreground text-xs">
            {t("summary", { count: submission.file_count, time: f.dateTime(submission.submitted_at) })}
          </span>
          {open || !canChange ? null : (
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
      ) : open || !acceptsSubmissions ? null : (
        <div>
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
            {t("handIn")}
          </Button>
        </div>
      )}
      {teacherComment ? (
        <div className="bg-muted rounded-md p-2 text-sm">
          <p className="text-muted-foreground text-xs">{tr("teacherComment")}</p>
          <p className="break-words whitespace-pre-wrap">{teacherComment}</p>
        </div>
      ) : null}
      {graded ? <p className="text-muted-foreground text-xs">{tr("readOnly")}</p> : null}
      {!acceptsSubmissions && !graded ? <p className="text-muted-foreground text-xs">{tr("closed")}</p> : null}
      {open && canChange ? (
        <div className="flex flex-col gap-2">
          <label htmlFor={answerId} className="text-muted-foreground text-xs">
            {tr("answer")}
          </label>
          <Textarea
            id={answerId}
            value={answer}
            maxLength={SUBMISSION_TEXT_MAX_LENGTH}
            rows={4}
            onChange={(event) => setAnswer(event.target.value)}
          />
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
            <Button
              type="button"
              size="sm"
              disabled={(files.length === 0 && answer.trim() === "") || submit.isPending}
              onClick={send}
            >
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
