"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons, PageHeader, Pill, Skeleton, StateView, Switch } from "@ihsp/ui"
import { useId, useState } from "react"
import { toast } from "sonner"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { COURSE_SOURCES, useAddLmsCourse, useCourseMutations, useCourses, type Course, type CourseSource } from "../api"
import { FreeCourses } from "./free-courses"
import { ManualCourseDialog } from "./manual-course-dialog"

function CourseRow({ course }: { course: Course }) {
  const t = useT("courses")
  const errorMessage = useErrorMessage()
  const { include } = useCourseMutations()
  const id = useId()
  const addLms = useAddLmsCourse()
  const busy = include.isPending || addLms.isPending
  const meta = [course.provider, course.level, course.year, course.grade].filter((v) => v !== null && v !== "")

  async function toggle(included: boolean) {
    if (!course.id) return
    try {
      await include.mutateAsync({ id: course.id, included })
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  async function add() {
    try {
      if (course.id) await include.mutateAsync({ id: course.id, included: true })
      else if (course.source === "lms" && course.source_ref) await addLms.mutateAsync(course.source_ref)
      toast.success(t("added"))
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-card border p-3">
      <div className="min-w-0">
        <p className="truncate font-medium">{course.title}</p>
        {meta.length > 0 ? <p className="text-muted-foreground truncate text-sm">{meta.join(" · ")}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {!course.included ? (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => void add()}>
            <Icons.add aria-hidden className="size-4" />
            {t("add")}
          </Button>
        ) : null}
        <label htmlFor={id} className="text-muted-foreground text-xs">
          {t("included")}
        </label>
        <Switch id={id} checked={course.included} disabled={!course.id || busy} onCheckedChange={toggle} />
      </div>
    </li>
  )
}

function SourceSection({ source, courses }: { source: CourseSource; courses: Course[] }) {
  const t = useT("courses")
  return (
    <section className="flex flex-col gap-2" aria-labelledby={`courses-${source}`}>
      <h2 id={`courses-${source}`} className="flex items-center gap-2 text-sm font-semibold">
        {t(`source.${source}`)}
        <Pill>{courses.length}</Pill>
      </h2>
      {courses.length === 0 ? (
        <p className="text-muted-foreground rounded-card border border-dashed p-3 text-sm">{t(`empty.${source}`)}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {courses.map((course) => (
            <CourseRow key={course.id ?? `${course.source}:${course.source_ref}`} course={course} />
          ))}
        </ul>
      )}
    </section>
  )
}

export function CoursesPage() {
  const t = useT("courses")
  const query = useCourses()
  const [adding, setAdding] = useState(false)
  return (
    <AdmissionShell>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 md:p-6">
        <PageHeader
          title={t("title")}
          actions={
            <Button onClick={() => setAdding(true)}>
              <Icons.add className="size-4" />
              {t("manual.open")}
            </Button>
          }
        />
        {query.isPending ? (
          <Skeleton className="h-40 w-full" />
        ) : query.isError ? (
          <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
        ) : (
          COURSE_SOURCES.map((source) => (
            <SourceSection key={source} source={source} courses={query.data.items.filter((c) => c.source === source)} />
          ))
        )}
        <FreeCourses />
        <ManualCourseDialog open={adding} onOpenChange={setAdding} />
      </div>
    </AdmissionShell>
  )
}
