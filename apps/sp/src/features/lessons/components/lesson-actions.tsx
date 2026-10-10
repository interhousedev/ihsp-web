"use client"

import type { LessonItem } from "@ihsp/api"
import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import Link from "next/link"
import { useOpenSubjectNotebook } from "../../subjects/hooks/use-subject-hub"

/** Links the lesson to its subject hub and opens the subject notebook chat with this lesson in focus. */
export function LessonActions({ lesson }: { lesson: LessonItem }) {
  const t = useT("lesson")
  const th = useT("subjects.hub")
  const f = useFormatters()
  const errorMessage = useErrorMessage()
  const open = useOpenSubjectNotebook(lesson.subject.id)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/subjects/view/?id=${encodeURIComponent(lesson.subject.id)}`}
          className="hover:bg-accent focus-visible:ring-ring inline-flex min-h-11 items-center gap-1 rounded-lg border px-3 text-sm outline-none focus-visible:ring-2 md:min-h-8"
        >
          <Icons.subjects aria-hidden />
          {t("toSubject", { subject: lesson.subject.name })}
        </Link>
        <Button
          variant="outline"
          className="min-h-11 md:min-h-8"
          disabled={open.isPending}
          onClick={() =>
            open.mutate({
              lessonId: lesson.id,
              question: th("question", {
                date: f.date(lesson.date, { day: "numeric", month: "long" }),
                topic: lesson.topic ?? th("noTopic"),
              }),
            })
          }
        >
          <Icons.assistant aria-hidden />
          {th("askAi")}
        </Button>
      </div>
      {open.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(open.error)}
        </p>
      ) : null}
    </div>
  )
}
