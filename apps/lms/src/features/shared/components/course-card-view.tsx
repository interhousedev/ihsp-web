"use client"

import type { CourseCard } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge, Card, CardContent, Icons, Progress, cn } from "@ihsp/ui"
import Link from "next/link"
import type { ReactNode } from "react"
import { hrefs } from "../utils/hrefs"
import { CourseCover } from "./course-cover"

/**
 * A course card like Stepik's: the cover, the title, a short description and the number of lessons; enrolled courses add
 * the progress bar. The whole card opens the course page (the title link is stretched over it); `actions` sit above that
 * link.
 */
export function CourseCardView({
  course,
  actions,
  className,
}: {
  course: CourseCard
  actions?: ReactNode
  className?: string
}) {
  const t = useT("courseCard")
  return (
    <Card
      className={cn(
        "relative gap-0 overflow-hidden pt-0 transition-shadow hover:shadow-md has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring",
        className,
      )}
    >
      <CourseCover title={course.title} url={course.cover_url} />
      <CardContent className="flex flex-1 flex-col gap-2 pt-4">
        <h2 className="text-base leading-snug font-semibold break-words">
          <Link
            href={hrefs.course(course.slug)}
            className="outline-none after:absolute after:inset-0 after:content-[''] hover:underline focus-visible:underline"
          >
            {course.title}
          </Link>
        </h2>
        {course.description ? <p className="text-muted-foreground line-clamp-2 text-sm">{course.description}</p> : null}
        <p className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span>{t("lessons", { count: course.steps_count })}</span>
          {course.visibility === "invite" ? (
            <Badge variant="outline">
              <Icons.lock aria-hidden />
              {t("invite")}
            </Badge>
          ) : null}
        </p>
        {course.progress_pct !== null ? (
          <Progress value={course.progress_pct} aria-label={t("progress")} className="mt-1 gap-1">
            <span className="text-muted-foreground ms-auto text-xs tabular-nums">{course.progress_pct}%</span>
          </Progress>
        ) : null}
        {actions ? <div className="relative z-10 mt-auto flex flex-wrap gap-2 pt-3">{actions}</div> : null}
      </CardContent>
    </Card>
  )
}
