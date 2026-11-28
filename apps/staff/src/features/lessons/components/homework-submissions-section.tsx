"use client"

import { getLessonHomeworkSubmissions, keys, type StaffSubmissionRow } from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Button, ScrollList } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { SubmissionAiCheck } from "@/features/ai-tools/components/submission-ai-check"
import { SubmissionReviewDialog } from "@/features/homework/components/submission-review-dialog"

type Status = "submitted" | "late" | "missing"

const VARIANT: Record<Status, "secondary" | "destructive" | "outline"> = {
  submitted: "secondary",
  late: "destructive",
  missing: "outline",
}

/** "3/25" badge: how many students handed the homework in. */
export function SubmissionsBadge({ submitted, total }: { submitted: number; total: number }) {
  const t = useT("homeworkSubmissions")
  return <Badge variant="outline">{t("badge", { submitted, total })}</Badge>
}

/** The lesson's homework hand-ins: the counts and, per student, the status, time, comment and files. */
export function HomeworkSubmissionsSection({ lessonId }: { lessonId: string }) {
  const t = useT("homeworkSubmissions")
  const tr = useT("homework")
  const f = useFormatters()
  const [reviewing, setReviewing] = useState<string | null>(null)
  const query = useQuery({
    queryKey: keys.staff.lessonHomeworkSubmissions(lessonId),
    queryFn: () => getLessonHomeworkSubmissions(lessonId),
  })
  return (
    <section id="submissions" aria-labelledby="homework-submissions-title" className="flex flex-col gap-3">
      <h2 id="homework-submissions-title" className="flex flex-wrap items-center gap-2 text-lg font-semibold">
        {t("title")}
        {query.data ? (
          <SubmissionsBadge
            submitted={query.data.counts.submitted + query.data.counts.late}
            total={query.data.counts.total}
          />
        ) : null}
      </h2>
      <QueryState query={query} rows={3}>
        {(data) => (
          <>
            <p className="text-muted-foreground text-sm">
              {t("counts", {
                submitted: data.counts.submitted,
                late: data.counts.late,
                missing: data.counts.missing,
              })}
            </p>
            {data.students.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("empty")}</p>
            ) : (
              <ScrollList label={t("title")} maxHeight="28rem">
                <ul className="divide-y rounded-lg border">
                  {data.students.map((row) => (
                    <li key={row.student.id} className="flex flex-col gap-1 p-3 text-sm">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">
                          {row.student.last_name} {row.student.first_name}
                        </span>
                        <span className="text-muted-foreground">{row.group_name}</span>
                        <Badge variant={VARIANT[row.status]}>{t(`status.${row.status}`)}</Badge>
                        {row.status !== "missing" && row.review_status ? (
                          <Badge variant={row.review_status === "pending" ? "outline" : "secondary"}>
                            {row.grade
                              ? tr("review.gradeValue", { grade: row.grade })
                              : tr(`review.status.${row.review_status}`)}
                          </Badge>
                        ) : null}
                        {row.submitted_at ? (
                          <span className="text-muted-foreground">{f.dateTime(row.submitted_at)}</span>
                        ) : null}
                      </span>
                      {row.comment ? <span>{row.comment}</span> : null}
                      {row.files.length > 0 ? (
                        <ul className="flex flex-col gap-0.5">
                          {row.files.map((file) => (
                            <li key={file.id}>
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
                      {row.status !== "missing" && row.id ? (
                        <>
                          <Button
                            variant="outline"
                            className="min-h-11 self-start md:min-h-8"
                            onClick={() => setReviewing(row.id)}
                          >
                            {tr("review.open")}
                          </Button>
                          <SubmissionAiCheck submissionId={row.id} fileCount={row.files.length} />
                        </>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </ScrollList>
            )}
          </>
        )}
      </QueryState>
      <SubmissionReviewDialog
        submissionId={reviewing}
        lessonId={lessonId}
        onOpenChange={(open) => {
          if (!open) setReviewing(null)
        }}
      />
    </section>
  )
}
