"use client"

import type { TeacherLesson } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import Link from "next/link"
import { useState } from "react"
import { classHref } from "../utils/teacher-display"

const COMPACT = 3

/** The teacher's classes with the student's groups for the next two weeks: a few lines, the rest on demand. */
export function UpcomingLessons({ lessons }: { lessons: TeacherLesson[] }) {
  const t = useT("teachers.card")
  const format = useFormatters()
  const [expanded, setExpanded] = useState(false)
  if (lessons.length <= 1) return null
  const shown = expanded ? lessons : lessons.slice(0, COMPACT)
  return (
    <section aria-label={t("upcoming")} className="flex flex-col gap-1">
      <h3 className="text-muted-foreground text-xs">{t("upcoming")}</h3>
      <ul className="flex flex-col gap-1 text-sm">
        {shown.map((lesson, index) => (
          <li key={`${lesson.starts_at}-${index}`}>
            <Link href={classHref(lesson)} className="flex flex-wrap gap-x-2 rounded hover:underline">
              <span className="font-medium">
                {format.date(lesson.date, { weekday: "short", day: "numeric", month: "short" })}
              </span>
              <span>{format.time(lesson.starts_at)}</span>
              <span>{lesson.subject}</span>
              <span className="text-muted-foreground">
                {[lesson.group, lesson.room ? t("room", { room: lesson.room }) : null].filter(Boolean).join(" · ")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {lessons.length > COMPACT ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-start"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          <Icons.chevronDown aria-hidden />
          {expanded ? t("showLess") : t("showAll", { count: lessons.length })}
        </Button>
      ) : null}
    </section>
  )
}
