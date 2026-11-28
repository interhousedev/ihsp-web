"use client"

import {
  getStaffHomeworkBoard,
  getStaffJournalOptionsQuery,
  keys,
  type HomeworkBoardLesson,
  type HomeworkBoardOnly,
  type HomeworkBoardParams,
} from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { useFormatters, useT, type IsoDate } from "@ihsp/i18n"
import { Badge, Card, DatePicker, Dropdown, PageContainer, StateView } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs"
import { useId } from "react"
import { JournalPicker } from "@/features/journal/components/journal-picker"
import { selectedOption } from "@/features/journal/utils/selection"
import { LinkButton } from "@/features/shared/components/link-button"
import { lessonHref } from "@/features/shared/utils/lesson-time"
import { EmisFiles } from "./emis-files"
import { HomeworkDefaults } from "./homework-defaults"
import { HomeworkSwitches } from "./homework-switches"

const ONLY = ["all", "with_homework", "to_review"] as const satisfies readonly HomeworkBoardOnly[]

/**
 * Homework (teachers): one subject and audience the teacher teaches, its lessons of the current term (or a date range)
 * with the homework text, EMIS topic and files, hand-in counts and the two switches; the teacher's own defaults on top.
 * `?subject=&audience=&from=&to=&only=` keep the filter in the address.
 */
export function HomeworkPage() {
  const t = useT("homework")
  const onlyId = useId()
  const [subject, setSubject] = useQueryState("subject", parseAsString)
  const [audience, setAudience] = useQueryState("audience", parseAsString)
  const [from, setFrom] = useQueryState("from", parseAsString)
  const [to, setTo] = useQueryState("to", parseAsString)
  const [only, setOnly] = useQueryState("only", parseAsStringLiteral(ONLY).withDefault("all"))
  const optionsQuery = useQuery(getStaffJournalOptionsQuery())
  const selected = selectedOption(optionsQuery.data ?? [], subject, audience)
  const params: HomeworkBoardParams | null = selected
    ? {
        subject_id: selected.subject.id,
        audience_key: selected.audience_key,
        only,
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
      }
    : null
  const boardQuery = useQuery({
    queryKey: keys.staff.homework.board(params ?? { subject_id: "", audience_key: "" }),
    queryFn: ({ signal }) => getStaffHomeworkBoard(params as HomeworkBoardParams, { signal }),
    enabled: params !== null,
  })

  return (
    <PageContainer title={t("title")}>
      <HomeworkDefaults />
      <QueryState
        query={optionsQuery}
        rows={2}
        isEmpty={(options) => options.length === 0}
        emptyText={t("noOptions")}
      >
        {(options) => (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <JournalPicker
                options={options}
                selected={selected}
                onChange={(nextSubject, nextAudience) => {
                  void setSubject(nextSubject)
                  void setAudience(nextAudience)
                }}
              />
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">{t("from")}</span>
                <DatePicker
                  aria-label={t("from")}
                  value={(from as IsoDate | null) ?? null}
                  max={(to as IsoDate | null) ?? undefined}
                  onChange={(date) => void setFrom(date)}
                  placeholder={t("termStart")}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">{t("to")}</span>
                <DatePicker
                  aria-label={t("to")}
                  value={(to as IsoDate | null) ?? null}
                  min={(from as IsoDate | null) ?? undefined}
                  onChange={(date) => void setTo(date)}
                  placeholder={t("termEnd")}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor={onlyId} className="text-sm font-medium">
                  {t("only.label")}
                </label>
                <Dropdown
                  id={onlyId}
                  className="w-full sm:w-56"
                  value={only}
                  onValueChange={(value) => void setOnly(ONLY.find((item) => item === value) ?? "all")}
                  options={ONLY.map((value) => ({ value, label: t(`only.${value}`) }))}
                />
              </div>
            </div>
            {params ? (
              <QueryState
                query={boardQuery}
                rows={4}
                isEmpty={(board) => board.lessons.length === 0}
                emptyText={t("noLessons")}
              >
                {(board) => (
                  <ul className="flex flex-col gap-3">
                    {board.lessons.map((lesson) => (
                      <BoardLessonCard key={lesson.lesson_id} lesson={lesson} />
                    ))}
                  </ul>
                )}
              </QueryState>
            ) : (
              <StateView state="empty" emptyText={t("noOptions")} />
            )}
          </>
        )}
      </QueryState>
    </PageContainer>
  )
}

function BoardLessonCard({ lesson }: { lesson: HomeworkBoardLesson }) {
  const t = useT("homework")
  const f = useFormatters()
  const { homework, counts } = lesson
  return (
    <li>
      <Card className="flex min-w-0 flex-col gap-3 p-4 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">
            {t("lessonWhen", {
              date: f.date(lesson.date, { weekday: "short", day: "numeric", month: "short" }),
              period: lesson.period,
            })}
          </span>
          {homework ? <Badge variant="outline">{t(`source.${homework.source}`)}</Badge> : null}
          {counts && counts.to_review > 0 ? (
            <Badge variant="destructive">{t("counts.toReview", { count: counts.to_review })}</Badge>
          ) : null}
        </div>
        {lesson.topic ? <p className="break-words">{lesson.topic}</p> : null}
        {lesson.emis_topic_description ? (
          <p className="text-muted-foreground break-words whitespace-pre-wrap">{lesson.emis_topic_description}</p>
        ) : null}
        {homework ? (
          <div className="flex flex-col gap-1">
            {homework.text ? <p className="break-words whitespace-pre-wrap">{homework.text}</p> : null}
            {homework.due_date ? (
              <p className="text-muted-foreground">
                {t("due", { date: f.date(homework.due_date, { day: "numeric", month: "long" }) })}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-muted-foreground">{t("noHomework")}</p>
        )}
        <EmisFiles files={lesson.emis_files} />
        {counts ? (
          <p className="text-muted-foreground">
            {t("counts.summary", {
              handedIn: counts.submitted + counts.late,
              total: counts.total,
              toReview: counts.to_review,
              graded: counts.graded,
            })}
          </p>
        ) : null}
        {homework ? (
          <HomeworkSwitches
            lessonId={lesson.lesson_id}
            acceptSubmissions={lesson.accept_submissions}
            notify={lesson.notify}
            notifyEffective={lesson.notify_effective}
          />
        ) : null}
        <div className="flex flex-wrap gap-2">
          <LinkButton href={lessonHref(lesson.lesson_id, homework ? "submissions" : "homework")}>
            {counts && counts.to_review > 0 ? t("review.open") : t("openLesson")}
          </LinkButton>
        </div>
      </Card>
    </li>
  )
}
