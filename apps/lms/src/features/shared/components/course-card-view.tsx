"use client"

import type { CourseCard } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge, Card, CardContent, Progress, cn } from "@ihsp/ui"
import Link from "next/link"
import type { ReactNode } from "react"
import { hrefs } from "../utils/hrefs"

function Cover({ course }: { course: CourseCard }) {
  if (course.cover_url) {
    return <img src={course.cover_url} alt="" loading="lazy" className="aspect-[16/7] w-full object-cover" />
  }
  return (
    <div
      aria-hidden
      className="from-primary/20 to-primary/5 text-primary/60 flex aspect-[16/7] w-full items-center justify-center bg-gradient-to-br text-4xl font-bold"
    >
      {course.title.slice(0, 1).toUpperCase()}
    </div>
  )
}

/** A course in the catalog, "My courses" and the managed list: cover, title, steps, progress and optional actions. */
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
    <Card className={cn("overflow-hidden pt-0", className)}>
      <Link href={hrefs.course(course.slug)} tabIndex={-1} aria-hidden>
        <Cover course={course} />
      </Link>
      <CardContent className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h2 className="min-w-0 text-base font-semibold break-words">
            <Link href={hrefs.course(course.slug)} className="hover:underline focus-visible:underline">
              {course.title}
            </Link>
          </h2>
          {course.visibility === "invite" ? <Badge variant="outline">{t("invite")}</Badge> : null}
        </div>
        {course.description ? <p className="text-muted-foreground line-clamp-3 text-sm">{course.description}</p> : null}
        <p className="text-muted-foreground text-xs">{t("steps", { count: course.steps_count })}</p>
        {course.progress_pct !== null ? (
          <Progress value={course.progress_pct} aria-label={t("progress")}>
            <span className="text-muted-foreground ms-auto text-xs tabular-nums">{course.progress_pct}%</span>
          </Progress>
        ) : null}
        {actions ? <div className="mt-auto flex flex-wrap gap-2 pt-2">{actions}</div> : null}
      </CardContent>
    </Card>
  )
}
