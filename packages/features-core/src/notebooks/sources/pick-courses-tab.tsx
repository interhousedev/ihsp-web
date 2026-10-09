"use client"

import { getLmsCourseQuery, getLmsMyCoursesQuery, type CourseCard } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Collapsible, CollapsibleContent, CollapsibleTrigger, StateView } from "@ihsp/ui"
import { IconChevronDown } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { SourceKindIcon } from "../lib/source-icons"
import type { PickTabProps } from "./add-types"
import { PickRow } from "./pick-row"
import { refValue } from "./source-rules"

/** The steps of one course (the outline is loaded when the course is opened). Test blocks are never exported. */
function CourseSteps({ course, sources, selection, full }: PickTabProps & { course: CourseCard }) {
  const t = useT("notebooks")
  const page = useQuery(getLmsCourseQuery(course.slug))
  const added = new Set(
    sources.filter((source) => source.kind === "lms_step").map((source) => refValue(source, "step_id")),
  )

  if (page.isPending) return <StateView state="loading" rows={2} />
  if (page.isError) return <StateView state="error" error={page.error} onRetry={() => void page.refetch()} />
  const sections = page.data.outline.filter((section) => section.steps.length > 0)
  if (sections.length === 0) return <StateView state="empty" emptyText={t("add.courses.noSteps")} />
  return (
    <div className="flex flex-col gap-3 ps-2">
      {sections.map((section) => (
        <section key={section.id} className="flex flex-col gap-1.5">
          <h4 className="text-muted-foreground text-xs font-medium">{section.title}</h4>
          <ul className="flex flex-col gap-1.5">
            {section.steps.map((step) => {
              const key = `lms:${step.step_id}`
              const already = added.has(step.step_id)
              const checked = already || selection.has(key)
              return (
                <PickRow
                  key={step.step_id}
                  label={step.title}
                  meta={step.points_total > 0 ? t("add.courses.hasTests") : undefined}
                  note={already ? t("add.alreadyAdded") : undefined}
                  icon={<SourceKindIcon kind="lms_step" />}
                  checked={checked}
                  disabled={already || (full && !checked)}
                  onToggle={() =>
                    selection.toggle({
                      key,
                      input: { kind: "lms_step", course_id: course.id, step_id: step.step_id },
                      label: step.title,
                    })
                  }
                />
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

function CourseItem({ course, ...pick }: PickTabProps & { course: CourseCard }) {
  const t = useT("notebooks")
  const [open, setOpen] = useState(false)
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border">
      <CollapsibleTrigger className="hover:bg-muted focus-visible:ring-ring group/course flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-start outline-hidden focus-visible:ring-2">
        <IconChevronDown
          aria-hidden
          className="size-4 shrink-0 -rotate-90 transition-transform group-data-panel-open/course:rotate-0 motion-reduce:transition-none"
        />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium">{course.title}</span>
          <span className="text-muted-foreground text-xs">{t("add.courses.steps", { count: course.steps_count })}</span>
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-2 pt-0">{open ? <CourseSteps course={course} {...pick} /> : null}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

/** Enrolled LMS courses; open one to tick its steps (text and cards only, never tests). */
export function PickCoursesTab(pick: PickTabProps) {
  const t = useT("notebooks")
  const courses = useQuery(getLmsMyCoursesQuery())
  const enrolled = courses.data?.enrolled ?? []

  if (courses.isPending) return <StateView state="loading" rows={3} />
  if (courses.isError) return <StateView state="error" error={courses.error} onRetry={() => void courses.refetch()} />
  if (enrolled.length === 0) return <StateView state="empty" emptyText={t("add.courses.empty")} />
  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground text-xs">{t("add.courses.testsNote")}</p>
      {enrolled.map((course) => (
        <CourseItem key={course.id} course={course} {...pick} />
      ))}
    </div>
  )
}
