"use client"

import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons, Pill, Skeleton, StateView, Switch } from "@ihsp/ui"
import { useId, useState } from "react"
import { toast } from "sonner"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { COURSE_SOURCES, useAddLmsCourse, useCourseMutations, useCourses, type Course, type CourseSource } from "../api"
import { AddCourseDialog, type AddCourseTab } from "./add-course-dialog"
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
        <p className="line-clamp-2 break-words font-medium">{course.title}</p>
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

function SourceSection({ source, courses, onFind }: { source: CourseSource; courses: Course[]; onFind: () => void }) {
  const t = useT("courses")
  return (
    <section className="flex flex-col gap-2" aria-labelledby={`courses-${source}`}>
      <h2 id={`courses-${source}`} className="flex items-center gap-2 text-sm font-semibold">
        {t(`source.${source}`)}
        <Pill>{courses.length}</Pill>
      </h2>
      {courses.length === 0 ? (
        <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 rounded-card border border-dashed p-3 text-sm">
          <p>{t(`empty.${source}`)}</p>
          {source === "lms" ? (
            <Button size="sm" variant="outline" onClick={onFind}>
              <Icons.search aria-hidden className="size-4" />
              {t("lmsPicker.cta")}
            </Button>
          ) : null}
        </div>
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
  const [picking, setPicking] = useState(false)
  const [tab, setTab] = useState<AddCourseTab>("lms")
  const [manual, setManual] = useState(false)
  const open = (next: AddCourseTab) => {
    setTab(next)
    setPicking(true)
  }
  return (
    <AdmissionShell>
      <div className={pageClass("narrow")}>
        <AppPageHeader
          icon="courses"
          title={t("title")}
          actions={
            <Button onClick={() => open("lms")}>
              <Icons.add className="size-4" />
              {t("addDialog.title")}
            </Button>
          }
        />
        {query.isPending ? (
          <Skeleton className="h-40 w-full" />
        ) : query.isError ? (
          <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
        ) : (
          COURSE_SOURCES.map((source) => (
            <SourceSection
              key={source}
              source={source}
              courses={query.data.items.filter((c) => c.source === source)}
              onFind={() => open("lms")}
            />
          ))
        )}
        <FreeCourses />
        <AddCourseDialog
          open={picking}
          onOpenChange={setPicking}
          tab={tab}
          onTabChange={setTab}
          onManual={() => {
            setPicking(false)
            setManual(true)
          }}
        />
        <ManualCourseDialog open={manual} onOpenChange={setManual} />
      </div>
    </AdmissionShell>
  )
}
