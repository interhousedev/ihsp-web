"use client"

import type { ControlExam, ControlPeriodItem } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { MarkBadge, ResponsiveDialog } from "@ihsp/ui"
import { formatPeriod } from "../../exams/utils/period"

/**
 * What a control week asks of the student: the exams still to take (subject, date, time) and the marks of the exams
 * already taken ("No mark yet" for one that passed without a mark). A dialog on a desktop, a sheet on a phone.
 */
export function ControlPeriodDialog({ period, onClose }: { period: ControlPeriodItem | null; onClose: () => void }) {
  const t = useT("timetable.controlPeriod")
  const f = useFormatters()
  const left = period?.exams.filter((exam) => exam.state === "upcoming") ?? []
  const taken = period?.exams.filter((exam) => exam.state === "taken") ?? []

  function when(exam: ControlExam): string {
    if (!exam.date) return t("noDate")
    const day = f.date(exam.date, { weekday: "short", day: "numeric", month: "short" })
    return exam.starts_at ? `${day} · ${f.time(exam.starts_at)}` : day
  }

  return (
    <ResponsiveDialog
      open={period !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title={
        period
          ? `${t(`full.${period.control}`)} · ${formatPeriod(period, (date, options) => f.date(date, options))}`
          : ""
      }
      size="md"
    >
      <div className="flex flex-col gap-5">
        <section aria-labelledby="control-left" className="flex flex-col gap-2">
          <h3 id="control-left" className="text-sm font-semibold">
            {t("left")}
          </h3>
          {left.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("noneLeft")}</p>
          ) : (
            <ul aria-labelledby="control-left" className="m-0 flex list-none flex-col gap-2 p-0">
              {left.map((exam) => (
                <li
                  key={`${exam.subject.id}-${exam.date}`}
                  className="flex flex-wrap items-baseline justify-between gap-x-3"
                >
                  <span className="text-sm font-medium">{exam.subject.name}</span>
                  <span className="text-muted-foreground text-sm">{when(exam)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section aria-labelledby="control-marks" className="flex flex-col gap-2">
          <h3 id="control-marks" className="text-sm font-semibold">
            {t("marks")}
          </h3>
          {taken.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("noneTaken")}</p>
          ) : (
            <ul aria-labelledby="control-marks" className="m-0 flex list-none flex-col gap-2 p-0">
              {taken.map((exam) => (
                <li key={`${exam.subject.id}-${exam.date}`} className="flex items-center justify-between gap-3">
                  <span className="flex flex-col">
                    <span className="text-sm font-medium">{exam.subject.name}</span>
                    <span className="text-muted-foreground text-xs">{when(exam)}</span>
                  </span>
                  {exam.mark === null ? (
                    <span className="text-muted-foreground text-sm">{t("noMark")}</span>
                  ) : (
                    <span role="img" aria-label={t("mark", { value: exam.mark })}>
                      <MarkBadge mark={exam.mark} />
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </ResponsiveDialog>
  )
}
