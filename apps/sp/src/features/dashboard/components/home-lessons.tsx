"use client"

import { useFormatters, useT } from "@ihsp/i18n"
import { Icons, Skeleton } from "@ihsp/ui"
import Link from "next/link"
import { useToday } from "../../today/hooks/use-today"

/** Today's lessons with an "All" link to the timetable; an empty state when there are none. */
export function HomeLessons() {
  const t = useT("home")
  const f = useFormatters()
  const query = useToday()
  const lessons = query.data?.lessons ?? []
  return (
    <section aria-labelledby="home-lessons-title" className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 id="home-lessons-title" className="text-base font-semibold">
          {t("lessons")}
        </h2>
        <Link
          href="/timetable/"
          className="text-primary inline-flex min-h-11 items-center gap-0.5 text-sm font-medium underline-offset-4 hover:underline"
        >
          {t("all")}
          <Icons.chevronRight className="size-4" aria-hidden />
        </Link>
      </div>
      {query.isPending ? (
        <Skeleton className="h-16 w-full rounded-2xl" />
      ) : query.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {t("lessonsError")}
        </p>
      ) : lessons.length === 0 ? (
        <p className="bg-card text-muted-foreground rounded-card border p-4 text-center text-sm">{t("noLessons")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {lessons.map((lesson) => (
            <li
              key={lesson.id}
              data-lesson-state={lesson.state}
              className={`bg-card flex items-center gap-3 rounded-card border p-3 text-sm ${
                lesson.state === "done" || lesson.state === "cancelled" ? "opacity-60" : ""
              } ${lesson.state === "now" ? "border-primary" : ""}`}
            >
              <span className="text-muted-foreground w-12 shrink-0 tabular-nums">{f.time(lesson.starts_at)}</span>
              <span
                className={`min-w-0 flex-1 truncate font-medium ${lesson.state === "cancelled" ? "line-through" : ""}`}
              >
                {lesson.subject.name}
              </span>
              {lesson.room?.name ? <span className="text-muted-foreground shrink-0">{lesson.room.name}</span> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
