"use client"

import type { HomeworkItem } from "@ihsp/api"
import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Badge, Button, Checkbox, cn } from "@ihsp/ui"
import Link from "next/link"
import { useState } from "react"
import { shortName } from "../../shared/utils/people"
import { useSetHomeworkDone } from "../hooks/use-homework"
import { HomeworkNoteEditor } from "./homework-note-editor"

/**
 * One homework item (WEB-19, WEB-20): tick box, subject, task, teacher, due date, the lesson it was given at,
 * an "updated" badge, how many days it is overdue and the student's private note. Ticking is personal tracking only.
 */
export function HomeworkItemCard({ item, withNote = true }: { item: HomeworkItem; withNote?: boolean }) {
  const t = useT("homework")
  const f = useFormatters()
  const errorMessage = useErrorMessage()
  const setDone = useSetHomeworkDone()
  const [editing, setEditing] = useState(false)
  const done = item.done_at !== null
  const overdue = !done && item.days_overdue > 0
  const dayFormat = { weekday: "short", day: "numeric", month: "short" } as const

  return (
    <li
      className={cn(
        "bg-card flex gap-1 rounded-lg border p-2 pe-3",
        overdue && "border-destructive/50 bg-destructive/5",
      )}
      data-testid="homework-item"
      data-done={done}
      data-overdue={overdue}
    >
      <div className="flex size-11 shrink-0 items-center justify-center">
        <Checkbox
          checked={done}
          disabled={setDone.isPending}
          aria-label={t("tick", { subject: item.subject.name })}
          onCheckedChange={(checked) => setDone.mutate({ lessonId: item.lesson_id, done: checked })}
        />
      </div>
      <div className="min-w-0 flex-1 py-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{item.subject.name}</span>
          {overdue ? <Badge variant="destructive">{t("overdueBy", { count: item.days_overdue })}</Badge> : null}
          {item.updated ? <Badge variant="secondary">{t("updated")}</Badge> : null}
        </div>
        <p className={cn("text-sm break-words", done && "text-muted-foreground line-through")}>{item.text}</p>
        <p className="text-muted-foreground mt-1 text-xs">
          {[
            item.teacher ? shortName(item.teacher) : null,
            item.due_date ? t("dueOn", { date: f.date(item.due_date, dayFormat) }) : t("noDueDate"),
            t("givenOn", { date: f.date(item.given_on, dayFormat) }),
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {withNote && item.note && !editing ? (
          <p className="bg-muted mt-2 rounded-md px-2 py-1.5 text-sm break-words whitespace-pre-line">
            <span className="text-muted-foreground block text-xs">{t("yourNote")}</span>
            {item.note}
          </p>
        ) : null}
        {editing ? <HomeworkNoteEditor item={item} onClose={() => setEditing(false)} /> : null}
        <div className="mt-1 flex flex-wrap items-center gap-x-4">
          <Link
            href={`/lessons/view/?id=${encodeURIComponent(item.lesson_id)}`}
            className="text-primary flex min-h-11 items-center text-sm underline-offset-4 hover:underline"
          >
            {t("openLesson")}
          </Link>
          {withNote && !editing ? (
            <Button variant="link" className="min-h-11 px-0" onClick={() => setEditing(true)}>
              {item.note ? t("editNote") : t("addNote")}
            </Button>
          ) : null}
        </div>
        {setDone.isError ? (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage(setDone.error)}
          </p>
        ) : null}
      </div>
    </li>
  )
}
