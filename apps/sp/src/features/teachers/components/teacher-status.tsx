"use client"

import type { MyTeacher } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge } from "@ihsp/ui"
import { teacherStatus } from "../utils/teacher-display"

/** "Now: lesson in 305", "Next: 14:10, room 207" or "No lessons today". */
export function TeacherStatusLine({ teacher }: { teacher: MyTeacher }) {
  const t = useT("teachers.status")
  const format = useFormatters()
  const status = teacherStatus(teacher)
  if (status.kind === "now") {
    return (
      <p className="flex flex-wrap items-center gap-2 text-sm">
        <Badge>{status.room ? t("now", { room: status.room }) : t("nowNoRoom")}</Badge>
      </p>
    )
  }
  if (status.kind === "none") {
    return <p className="text-muted-foreground text-sm">{t("none")}</p>
  }
  const when = status.today
    ? format.time(status.startsAt)
    : `${format.weekday(status.startsAt)} ${format.time(status.startsAt)}`
  return (
    <p className="text-muted-foreground text-sm">
      {status.room ? t("next", { when, room: status.room }) : t("nextNoRoom", { when })}
    </p>
  )
}
