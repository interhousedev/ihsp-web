"use client"

import type { SubjectCard as SubjectCardData } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Card, CardContent, MarkBadge } from "@ihsp/ui"
import Link from "next/link"
import { shortName } from "../../shared/utils/people"

/** A subject of the semester (WEB-7): teachers, semester mark, EMIS rating, absences and the next lesson. */
export function SubjectCard({ card, semester }: { card: SubjectCardData; semester: number | undefined }) {
  const t = useT("subjects")
  const f = useFormatters()
  const query = new URLSearchParams({ id: card.subject.id })
  if (semester) query.set("semester", String(semester))
  const next = card.next_lesson

  return (
    <li>
      {/* oxlint-disable-next-line jsx-a11y/control-has-associated-label -- the card text is the link name */}
      <Link
        href={`/subjects/view/?${query.toString()}`}
        className="focus-visible:ring-ring block rounded-xl outline-none focus-visible:ring-2"
      >
        <Card className="hover:bg-accent/40 h-full transition-colors">
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-base font-semibold break-words">{card.subject.name}</h2>
                <p className="text-muted-foreground truncate text-xs">{card.teachers.map(shortName).join(", ")}</p>
              </div>
              <MarkBadge mark={card.semester_mark} size="lg" />
            </div>
            <dl className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <dt className="text-muted-foreground">{t("emisRating")}</dt>
                <dd className="text-sm font-medium">{card.emis_rating ?? "–"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("absences")}</dt>
                <dd className="text-sm font-medium">{card.absences}</dd>
              </div>
            </dl>
            <p className="text-muted-foreground text-xs">
              {next
                ? t("nextLesson", {
                    date: f.date(next.date, { weekday: "short", day: "numeric", month: "short" }),
                    time: f.time(next.starts_at),
                  })
                : t("noNextLesson")}
            </p>
          </CardContent>
        </Card>
      </Link>
    </li>
  )
}
