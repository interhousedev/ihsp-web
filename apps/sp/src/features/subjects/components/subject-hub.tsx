"use client"

import type { MarkItem, SubjectLessonRow } from "@ihsp/api"
import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Badge, Button, Icons, MarkBadge, StateView } from "@ihsp/ui"
import Link from "next/link"
import { useState } from "react"
import { QueryState } from "../../shared/components/query-state"
import { PAST_STEP, useOpenSubjectNotebook, useSubjectLessons } from "../hooks/use-subject-hub"

/** Green when present, dark orange when late, dark red when absent: the same dots as in the calendar. */
export function AttendanceDot({ state }: { state: SubjectLessonRow["attendance"] }) {
  const t = useT("subjects.hub.attendance")
  if (state === null) return null
  const colour = state === "present" ? "bg-green-600" : state === "late" ? "bg-orange-700" : "bg-red-800"
  const text =
    state === "late"
      ? "text-orange-700 dark:text-orange-400"
      : state === "absent"
        ? "text-red-800 dark:text-red-400"
        : ""
  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${text}`} data-attendance={state}>
      <span className={`size-2.5 rounded-full ${colour}`} aria-hidden />
      {t(state)}
    </span>
  )
}

function LessonRow({
  row,
  marks,
  onAsk,
  asking,
}: {
  row: SubjectLessonRow
  marks: readonly MarkItem[]
  onAsk: (row: SubjectLessonRow) => void
  asking: boolean
}) {
  const t = useT("subjects.hub")
  const f = useFormatters()
  const tm = useT("subjects.marks")
  const shown = marks.length > 0 ? marks : row.mark !== null ? [{ value: row.mark, type: "lesson" as const }] : []
  return (
    <li
      className="flex flex-col gap-2 rounded-lg border p-3 data-[attendance=absent]:border-red-800 data-[attendance=late]:border-orange-700"
      data-past={row.past}
      data-attendance={row.attendance ?? undefined}
    >
      <Link
        href={`/lessons/view/?id=${encodeURIComponent(row.lesson_id)}`}
        className="hover:bg-accent focus-visible:ring-ring -m-1 flex min-h-11 flex-col gap-1 rounded-md p-1 outline-none focus-visible:ring-2"
      >
        <span className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium">
            {f.date(row.date, { weekday: "short", day: "numeric", month: "short" })} · {f.time(row.starts_at)}
          </span>
          <span className="flex items-center gap-2">
            {shown.map((mark, index) => (
              <span key={`${mark.type}-${index}`} className="flex items-center gap-1" data-mark-type={mark.type}>
                <span className="text-muted-foreground text-xs">{tm(`type.${mark.type}`)}</span>
                <MarkBadge mark={mark.value} size="sm" />
              </span>
            ))}
            <AttendanceDot state={row.attendance} />
          </span>
        </span>
        <span className="text-muted-foreground text-sm break-words">{row.topic ?? t("noTopic")}</span>
        <span className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{t(`kind.${row.kind}`)}</Badge>
          {row.materials_count > 0 ? (
            <span className="text-muted-foreground text-xs">{t("materials", { count: row.materials_count })}</span>
          ) : null}
        </span>
      </Link>
      <Button
        variant="ghost"
        size="sm"
        className="min-h-11 w-fit md:min-h-8"
        disabled={asking}
        onClick={() => onAsk(row)}
      >
        <Icons.assistant aria-hidden />
        {t("askAi")}
      </Button>
    </li>
  )
}

/**
 * The subject hub (UF-WEB-05): the notebook of the subject, then one list of lessons built around now: the latest
 * past lessons with mark and attendance, "show more" for older ones, and the next 14 days. Each lesson can be asked
 * about in the subject notebook.
 */
export function SubjectHub({ subjectId, marks }: { subjectId: string; marks: readonly MarkItem[] }) {
  const t = useT("subjects.hub")
  const errorMessage = useErrorMessage()
  const [pastLimit, setPastLimit] = useState(PAST_STEP)
  const query = useSubjectLessons(subjectId, pastLimit)
  const open = useOpenSubjectNotebook(subjectId)
  const f = useFormatters()

  const marksOf = (row: SubjectLessonRow) => marks.filter((mark) => mark.lesson_id === row.lesson_id)

  function ask(row: SubjectLessonRow) {
    const when = f.date(row.date, { day: "numeric", month: "long" })
    open.mutate({
      lessonId: row.lesson_id,
      question: t("question", { date: when, topic: row.topic ?? t("noTopic") }),
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {open.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(open.error)}
        </p>
      ) : null}
      <QueryState query={query} isEmpty={(data) => data.items.length === 0} emptyText={t("empty")} rows={4}>
        {(data) => {
          const past = data.items.filter((row) => row.past)
          const upcoming = data.items.filter((row) => !row.past)
          return (
            <div className="flex flex-col gap-4">
              {past.length > 0 ? (
                <section aria-labelledby="hub-past" className="flex flex-col gap-2">
                  <h2 id="hub-past" className="text-sm font-semibold">
                    {t("past")}
                  </h2>
                  <ul className="flex flex-col gap-2">
                    {past.map((row) => (
                      <LessonRow
                        key={row.lesson_id}
                        row={row}
                        marks={marksOf(row)}
                        onAsk={ask}
                        asking={open.isPending}
                      />
                    ))}
                  </ul>
                  {data.has_more_past ? (
                    <Button
                      variant="outline"
                      className="min-h-11 w-fit md:min-h-8"
                      onClick={() => setPastLimit((limit) => limit + PAST_STEP)}
                    >
                      {t("showMore")}
                    </Button>
                  ) : null}
                </section>
              ) : null}
              <section aria-labelledby="hub-upcoming" className="flex flex-col gap-2">
                <h2 id="hub-upcoming" className="text-sm font-semibold">
                  {t("upcoming")}
                </h2>
                {upcoming.length === 0 ? (
                  <StateView state="empty" emptyText={t("noUpcoming")} />
                ) : (
                  <ul className="flex flex-col gap-2">
                    {upcoming.map((row) => (
                      <LessonRow
                        key={row.lesson_id}
                        row={row}
                        marks={marksOf(row)}
                        onAsk={ask}
                        asking={open.isPending}
                      />
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )
        }}
      </QueryState>
    </div>
  )
}
