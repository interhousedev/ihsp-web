"use client"

import type { AssessmentItem } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Card, CardContent } from "@ihsp/ui"
import { useExamLabels } from "../hooks/use-exam-labels"
import { ExamBadges } from "./exam-badges"

/** Why a date is not final: one line per reason (the source of a tentative date, a week without a date). */
function useExplanations(item: AssessmentItem): string[] {
  const explain = useT("exams.view.explain")
  const lines: string[] = []
  if (!item.has_date) lines.push(explain("undated"))
  if (item.status === "tentative") {
    if (item.source === "emis") lines.push(explain("emis"))
    else if (item.source === "head_student") lines.push(explain("headStudent"))
    else lines.push(explain("tentative"))
  }
  return lines
}

function Fact({ label, children }: { label: string; children: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  )
}

/** The top of the preparation page: topic, the big countdown, badges with their reason, date, time, room and the note. */
export function ExamSummary({ item }: { item: AssessmentItem }) {
  const t = useT("exams.view")
  const f = useFormatters()
  const labels = useExamLabels()
  const explanations = useExplanations(item)
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-2">
            {item.title ? <p className="text-base font-medium break-words">{item.title}</p> : null}
            <ExamBadges item={item} />
          </div>
          <p className="text-4xl font-bold tabular-nums" data-testid="exam-countdown">
            {labels.countdown(item)}
          </p>
        </div>
        {explanations.map((line) => (
          <p key={line} className="text-muted-foreground text-sm">
            {line}
          </p>
        ))}
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {item.has_date ? (
            <Fact label={t("date")}>
              {f.date(item.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </Fact>
          ) : item.period ? (
            <Fact label={t("week")}>{labels.period(item.period)}</Fact>
          ) : null}
          {item.starts_at ? <Fact label={t("time")}>{f.time(item.starts_at)}</Fact> : null}
          {item.room ? <Fact label={t("room")}>{item.room}</Fact> : null}
        </dl>
        {item.note ? (
          <div className="flex flex-col gap-0.5">
            <p className="text-muted-foreground text-xs">{t("note")}</p>
            <p className="text-sm whitespace-pre-line">{item.note}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
