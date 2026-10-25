"use client"

import type { AssessmentItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Card, CardContent } from "@ihsp/ui"
import Link from "next/link"
import { useExamLabels } from "../hooks/use-exam-labels"
import { examHref } from "../utils/hrefs"
import { ExamBadges } from "./exam-badges"

/** One control as a card that opens its preparation page: subject, control, date and time, room, countdown, badges. */
export function ExamRow({ item }: { item: AssessmentItem }) {
  const t = useT("exams.row")
  const labels = useExamLabels()
  const details = [labels.when(item), item.room ? t("room", { room: item.room }) : null].filter(Boolean).join(" · ")
  return (
    <li data-testid="exam-row">
      {/* oxlint-disable-next-line jsx-a11y/control-has-associated-label -- the card text is the link name */}
      <Link
        href={examHref(item.id)}
        className="focus-visible:ring-ring block rounded-xl outline-none focus-visible:ring-2"
      >
        <Card size="sm">
          <CardContent className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="font-semibold break-words">{item.subject.name}</span>
              <span className="text-sm break-words">
                {labels.control(item)}
                {item.title ? ` · ${item.title}` : ""}
              </span>
              <span className="text-muted-foreground text-xs">{details}</span>
              <ExamBadges item={item} />
            </div>
            <span className="shrink-0 text-sm font-medium">{labels.countdown(item)}</span>
          </CardContent>
        </Card>
      </Link>
    </li>
  )
}
