"use client"

import type { SemesterGrades } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Card, CardContent, MarkBadge } from "@ihsp/ui"
import Link from "next/link"
import { LinkButton } from "../../shared/components/link-button"
import { plannerHref } from "../planner/utils/hrefs"
import { subjectMarksHref } from "../utils/links"

/** The same rows as cards, one per subject, for phones (UF-WEB-09 step 2). */
export function GradesCards({ grades }: { grades: SemesterGrades }) {
  const t = useT("grades.semester")
  return (
    <ul className="flex flex-col gap-3">
      {grades.rows.map((row) => (
        <li key={row.subject.id} data-testid="grade-card">
          <Card size="sm">
            <CardContent className="flex flex-col gap-2">
              {/* oxlint-disable-next-line jsx-a11y/control-has-associated-label -- the card text is the link name */}
              <Link
                href={subjectMarksHref(row.subject.id, grades.semester)}
                className="focus-visible:ring-ring flex flex-col gap-2 rounded-lg outline-none focus-visible:ring-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold break-words">{row.subject.name}</span>
                  <MarkBadge mark={row.semester_mark} size="lg" />
                </div>
                <dl className="grid grid-cols-4 gap-2 text-center text-xs">
                  {(
                    [
                      [t("lessonAvg"), <MarkBadge key="l" mark={row.lesson_avg} size="sm" />],
                      [t("midtermAvg"), <MarkBadge key="m" mark={row.midterm_avg} size="sm" />],
                      [t("finalAvg"), <MarkBadge key="f" mark={row.final_avg} size="sm" />],
                      [t("emisRating"), row.emis_rating ?? "–"],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="flex flex-col items-center gap-1">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="text-sm font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
              </Link>
              <LinkButton
                href={plannerHref(row.subject.id, grades.semester)}
                variant="ghost"
                className="self-end"
                aria-label={t("planFor", { subject: row.subject.name })}
              >
                {t("plan")}
              </LinkButton>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  )
}
