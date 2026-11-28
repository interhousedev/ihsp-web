"use client"

import {
  deleteStaffHomeworkReview,
  getStaffHomeworkSubmission,
  keys,
  putStaffHomeworkReview,
  type HomeworkReviewBody,
  type StaffSubmissionRow,
} from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Badge, Button, LoadingButton, ResponsiveDialog, Textarea, ToggleGroup, ToggleGroupItem } from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useId, useState } from "react"
import { toast } from "sonner"

const GRADES = [5, 4, 3, 2] as const
const COMMENT_MAX = 2000

/** Opens one hand-in: the student's text, comment and files, then grade it (2 to 5) or return it with a comment. */
export function SubmissionReviewDialog({
  submissionId,
  lessonId,
  onOpenChange,
}: {
  submissionId: string | null
  lessonId: string
  onOpenChange: (open: boolean) => void
}) {
  const t = useT("homework")
  const query = useQuery({
    queryKey: keys.staff.homework.submission(submissionId ?? ""),
    queryFn: ({ signal }) => getStaffHomeworkSubmission(submissionId ?? "", { signal }),
    enabled: submissionId !== null,
  })
  return (
    <ResponsiveDialog
      open={submissionId !== null}
      onOpenChange={onOpenChange}
      title={query.data ? `${query.data.student.last_name} ${query.data.student.first_name}` : t("review.title")}
      description={query.data?.group_name}
      size="lg"
    >
      <QueryState query={query} rows={4}>
        {(row) => (
          <ReviewBodyView
            key={`${row.id}-${row.review_status}`}
            row={row}
            lessonId={lessonId}
            onDone={() => onOpenChange(false)}
          />
        )}
      </QueryState>
    </ResponsiveDialog>
  )
}

function ReviewBodyView({ row, lessonId, onDone }: { row: StaffSubmissionRow; lessonId: string; onDone: () => void }) {
  const t = useT("homework")
  const f = useFormatters()
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const commentId = useId()
  const [grade, setGrade] = useState<string>(row.grade ? String(row.grade) : "")
  const [comment, setComment] = useState(row.teacher_comment ?? "")
  const id = row.id ?? ""

  function refresh(updated?: StaffSubmissionRow) {
    if (updated) queryClient.setQueryData(keys.staff.homework.submission(id), updated)
    else void queryClient.invalidateQueries({ queryKey: keys.staff.homework.submission(id) })
    void queryClient.invalidateQueries({ queryKey: keys.staff.lessonHomeworkSubmissions(lessonId) })
    void queryClient.invalidateQueries({ queryKey: keys.staff.homework.boardAll() })
  }

  const review = useMutation({
    mutationFn: (body: HomeworkReviewBody) => putStaffHomeworkReview(id, body),
    onSuccess: (updated) => {
      refresh(updated)
      toast.success(t("review.saved"))
      onDone()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })
  const clear = useMutation({
    mutationFn: () => deleteStaffHomeworkReview(id),
    onSuccess: () => {
      refresh()
      toast.success(t("review.cleared"))
    },
    onError: (error) => toast.error(errorMessage(error)),
  })
  const busy = review.isPending || clear.isPending
  const trimmed = comment.trim()

  return (
    <div className="flex min-w-0 flex-col gap-4 text-sm">
      <p className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{t(`review.status.${row.review_status}`)}</Badge>
        {row.grade ? <Badge>{t("review.gradeValue", { grade: row.grade })}</Badge> : null}
        {row.submitted_at ? <span className="text-muted-foreground">{f.dateTime(row.submitted_at)}</span> : null}
        {row.status === "late" ? <Badge variant="destructive">{t("review.late")}</Badge> : null}
      </p>
      {row.text ? <p className="bg-muted/50 rounded-lg p-3 break-words whitespace-pre-wrap">{row.text}</p> : null}
      {row.comment ? (
        <p className="break-words">
          <span className="text-muted-foreground">{t("review.studentComment")}: </span>
          {row.comment}
        </p>
      ) : null}
      {row.files.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {row.files.map((file) => (
            <li key={file.id} className="min-w-0 truncate">
              <a
                href={file.download_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2"
              >
                {file.name}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      {row.previous_comment ? (
        <p className="text-muted-foreground break-words">
          {t("review.previousComment")}: {row.previous_comment}
        </p>
      ) : null}
      {row.reviewed_at && row.reviewer ? (
        <p className="text-muted-foreground">
          {t("review.reviewedBy", {
            name: `${row.reviewer.last_name} ${row.reviewer.first_name}`,
            date: f.dateTime(row.reviewed_at),
          })}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <span className="font-medium">{t("review.grade")}</span>
        <ToggleGroup
          aria-label={t("review.grade")}
          variant="outline"
          value={grade ? [grade] : []}
          onValueChange={(value) => setGrade(value[0] ?? "")}
        >
          {GRADES.map((value) => (
            <ToggleGroupItem key={value} value={String(value)} className="min-h-11 min-w-11 md:min-h-8">
              {value}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={commentId} className="font-medium">
          {t("review.comment")}
        </label>
        <Textarea
          id={commentId}
          value={comment}
          maxLength={COMMENT_MAX}
          onChange={(event) => setComment(event.target.value)}
          placeholder={t("review.commentHint")}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <LoadingButton
          className="min-h-11 md:min-h-8"
          loading={review.isPending && review.variables?.action === "grade"}
          disabled={busy || !grade}
          onClick={() =>
            review.mutate({ action: "grade", grade: Number(grade), ...(trimmed ? { comment: trimmed } : {}) })
          }
        >
          {t("review.gradeAction")}
        </LoadingButton>
        <LoadingButton
          variant="outline"
          className="min-h-11 md:min-h-8"
          loading={review.isPending && review.variables?.action === "return"}
          disabled={busy || trimmed === ""}
          onClick={() => review.mutate({ action: "return", comment: trimmed })}
        >
          {t("review.returnAction")}
        </LoadingButton>
        {row.review_status !== "pending" ? (
          <Button variant="ghost" className="min-h-11 md:min-h-8" disabled={busy} onClick={() => clear.mutate()}>
            {t("review.clearAction")}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
