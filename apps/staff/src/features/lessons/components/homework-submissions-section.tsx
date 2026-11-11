"use client"

import { getLessonHomeworkSubmissions } from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, ScrollList } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"

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
  const f = useFormatters()
  const query = useQuery({
    queryKey: ["staff", "lesson", lessonId, "homework-submissions"],
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
                    </li>
                  ))}
                </ul>
              </ScrollList>
            )}
          </>
        )}
      </QueryState>
    </section>
  )
}
