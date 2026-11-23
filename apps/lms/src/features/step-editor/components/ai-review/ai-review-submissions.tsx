"use client"

import { getLmsAiReviewSubmissionsQuery, type AiReviewSubmission } from "@ihsp/api"
import { MessageWithOpenUi, chatLibrary } from "@ihsp/features-core/openui"
import { formatDateTime, useErrorMessage, useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Badge,
  Markdown,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Skeleton,
} from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"

function renderMarkdown(text: string) {
  return <Markdown className="text-sm">{text}</Markdown>
}

/** One entry per student, newest submission first; the older ones follow it. */
function byStudent(items: AiReviewSubmission[]): AiReviewSubmission[][] {
  const sorted = [...items].sort((a, b) => (b.submitted_at ?? "").localeCompare(a.submitted_at ?? ""))
  const groups = new Map<string, AiReviewSubmission[]>()
  for (const item of sorted) {
    const group = groups.get(item.student.id)
    if (group) group.push(item)
    else groups.set(item.student.id, [item])
  }
  return [...groups.values()]
}

function Review({ item, emptyText }: { item: AiReviewSubmission; emptyText: string }) {
  return item.review_openui ? (
    <MessageWithOpenUi text={item.review_openui} library={chatLibrary} renderMarkdown={renderMarkdown} />
  ) : (
    <p className="text-muted-foreground text-sm">{emptyText}</p>
  )
}

/** Course staff: the students' work on one AI review block with the latest review of each. */
export function AiReviewSubmissions({
  open,
  onOpenChange,
  courseId,
  stepId,
  blockId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseId: string
  stepId: string
  blockId: string
}) {
  const t = useT("stepEditor")
  const errorMessage = useErrorMessage()
  const submissions = useQuery({ ...getLmsAiReviewSubmissionsQuery(courseId, stepId, blockId), enabled: open })
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{t("aiReview.submissions.title")}</SheetTitle>
          <SheetDescription>{t("aiReview.submissions.description")}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-3 px-4 pb-6">
          {submissions.isPending ? (
            <Skeleton className="h-32 w-full" />
          ) : submissions.isError ? (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage(submissions.error)}</AlertDescription>
            </Alert>
          ) : submissions.data.items.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("aiReview.submissions.empty")}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {byStudent(submissions.data.items).map(([item, ...older]) => (
                <li key={item.session_id} className="rounded-lg border">
                  <details>
                    <summary className="flex min-h-11 cursor-pointer flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2">
                      <span className="min-w-48 flex-1 text-sm font-medium break-words">{item.student.name}</span>
                      {item.submitted_at ? (
                        <span className="text-muted-foreground text-xs">{formatDateTime(item.submitted_at)}</span>
                      ) : null}
                      <Badge variant={item.status === "reviewed" ? "default" : "outline"}>
                        {t(`aiReview.submissions.status.${item.status}`)}
                      </Badge>
                    </summary>
                    <div className="flex flex-col gap-3 border-t p-3">
                      <Review item={item} emptyText={t("aiReview.submissions.noReview")} />
                      {older.length > 0 ? (
                        <details className="rounded-md border">
                          <summary className="text-muted-foreground min-h-11 cursor-pointer px-3 py-2 text-sm">
                            {t("aiReview.submissions.earlier", { count: older.length })}
                          </summary>
                          <ul className="flex flex-col gap-3 border-t p-3">
                            {older.map((earlier) => (
                              <li key={earlier.session_id} className="flex flex-col gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  {earlier.submitted_at ? (
                                    <span className="text-muted-foreground text-xs">
                                      {formatDateTime(earlier.submitted_at)}
                                    </span>
                                  ) : null}
                                  <Badge variant={earlier.status === "reviewed" ? "default" : "outline"}>
                                    {t(`aiReview.submissions.status.${earlier.status}`)}
                                  </Badge>
                                </div>
                                <Review item={earlier} emptyText={t("aiReview.submissions.noReview")} />
                              </li>
                            ))}
                          </ul>
                        </details>
                      ) : null}
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
