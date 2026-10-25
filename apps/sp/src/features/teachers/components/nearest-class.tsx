"use client"

import type { MyTeacher, TeacherLesson } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge } from "@ihsp/ui"
import Link from "next/link"
import { classHref, nearestLesson } from "../utils/teacher-display"

/** Date, time and room of the nearest class, linking to the lesson (or the subject's lessons). */
export function NearestClass({ teacher }: { teacher: MyTeacher }) {
  const t = useT("teachers.card")
  const lesson = nearestLesson(teacher)
  if (!lesson) return <p className="text-muted-foreground text-sm">{t("none")}</p>
  const running = teacher.teaching_now && teacher.current !== null
  return (
    <div className="flex flex-col gap-1 text-sm">
      <span className="text-muted-foreground text-xs">{t("nearest")}</span>
      <Link href={classHref(lesson)} className="flex flex-wrap items-center gap-x-2 gap-y-1 hover:underline">
        {running ? <Badge>{t("now")}</Badge> : null}
        <NearestWhen lesson={lesson} />
      </Link>
    </div>
  )
}

function NearestWhen({ lesson }: { lesson: TeacherLesson }) {
  const t = useT("teachers.card")
  const format = useFormatters()
  return (
    <>
      <span className="font-medium">
        {format.date(lesson.date, { weekday: "short", day: "numeric", month: "short" })}
      </span>
      <span>
        {format.time(lesson.starts_at)}–{format.time(lesson.ends_at)}
      </span>
      {lesson.room ? <span className="text-muted-foreground">{t("room", { room: lesson.room })}</span> : null}
    </>
  )
}
