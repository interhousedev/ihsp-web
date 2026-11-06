"use client"

import type { SubjectDetail } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Icons, MarkBadge, StateView } from "@ihsp/ui"
import Link from "next/link"
import { plannerHref } from "../../grades/planner/utils/hrefs"
import { LinkButton } from "../../shared/components/link-button"

/** My marks: every mark of the subject in the semester shown, newest first, and the way to the mark planner. */
export function SubjectMarksTab({ detail }: { detail: SubjectDetail }) {
  const t = useT("subjects.overview")
  const tm = useT("subjects.marks")
  const f = useFormatters()
  const marks = detail.marks.toSorted((a, b) => b.date.localeCompare(a.date))
  return (
    <div className="flex flex-col gap-3">
      <LinkButton href={plannerHref(detail.subject.id, detail.semester)} className="w-fit">
        <Icons.grades aria-hidden />
        {t("planner")}
      </LinkButton>
      {marks.length === 0 ? (
        <StateView state="empty" emptyText={t("noMarks")} />
      ) : (
        <ul className="flex flex-col divide-y rounded-lg border">
          {marks.map((mark, index) => {
            const body = (
              <>
                <span className="min-w-0 flex-1 text-sm">{f.date(mark.date, { day: "numeric", month: "long" })}</span>
                <span className="text-muted-foreground text-xs">{tm(`type.${mark.type}`)}</span>
                <MarkBadge mark={mark.value} />
              </>
            )
            const row = "flex min-h-11 items-center gap-3 px-3 py-2"
            return (
              <li key={`${mark.date}-${mark.type}-${index}`} data-testid="subject-mark">
                {mark.lesson_id ? (
                  <Link
                    href={`/lessons/view/?id=${encodeURIComponent(mark.lesson_id)}`}
                    className={`${row} hover:bg-accent focus-visible:ring-ring outline-none focus-visible:ring-2`}
                  >
                    {body}
                  </Link>
                ) : (
                  <div className={row}>{body}</div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
