"use client"

import type { StaffAssessmentItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge, Button } from "@ihsp/ui"
import Link from "next/link"
import { lessonHref } from "../../shared/utils/lesson-time"
import { useExamWhen } from "../hooks/use-exam-when"
import { ExamStatusBadge } from "./exam-status-badge"
import type { ExamRowActions } from "./exam-row"

/**
 * A date nobody confirmed: where it came from (an EMIS lesson, the head student), the date and the note, with the
 * three ways out: Confirm as is, Edit and confirm, Dismiss.
 */
export function SuggestionRow({
  item,
  busy,
  actions,
}: {
  item: StaffAssessmentItem
  busy: boolean
  actions: Pick<ExamRowActions, "onEdit" | "onConfirm" | "onDismiss">
}) {
  const t = useT("exams.suggestions")
  const te = useT("exams")
  const when = useExamWhen()
  const subject = item.subject.name
  const buttonClass = "min-h-11 md:min-h-8"
  const origin =
    item.source === "head_student" ? (
      t("fromHeadStudent")
    ) : item.lesson_id ? (
      <Link href={lessonHref(item.lesson_id)} className="underline underline-offset-2">
        {t("fromEmis")}
      </Link>
    ) : (
      t("fromEmis")
    )

  return (
    <li className="bg-background flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{subject}</span>
          <Badge variant="outline">{te(`kinds.${item.kind}`)}</Badge>
          <ExamStatusBadge status="tentative" />
        </div>
        <p className="text-muted-foreground text-xs">{origin}</p>
        <p className="text-sm">{when(item)}</p>
        {item.title !== "" ? <p className="text-muted-foreground text-xs">{item.title}</p> : null}
        {item.note ? <p className="line-clamp-2 text-sm">{item.note}</p> : null}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button
          className={buttonClass}
          disabled={busy}
          aria-label={t("confirmAsIsFor", { subject })}
          onClick={() => actions.onConfirm(item)}
        >
          {t("confirmAsIs")}
        </Button>
        <Button
          variant="outline"
          className={buttonClass}
          disabled={busy}
          aria-label={t("editConfirmFor", { subject })}
          onClick={() => actions.onEdit(item)}
        >
          {t("editConfirm")}
        </Button>
        <Button
          variant="ghost"
          className={buttonClass}
          disabled={busy}
          aria-label={t("dismissFor", { subject })}
          onClick={() => actions.onDismiss(item)}
        >
          {t("dismiss")}
        </Button>
      </div>
    </li>
  )
}
