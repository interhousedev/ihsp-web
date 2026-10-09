"use client"

import { useT } from "@ihsp/i18n"
import { StateView } from "@ihsp/ui"
import { useCourseSteps } from "../api/use-course-workspace"
import { SourceKindIcon } from "../lib/source-icons"
import type { PickTabProps } from "./add-types"
import { PickRow } from "./pick-row"
import { refValue } from "./source-rules"

/**
 * The steps of the workspace's own course, as they are in the DRAFT (text and flash cards, never tests). A step added
 * here is read again when it changes ("outdated" marks it, Sync refreshes it).
 */
export function PickCourseStepsTab({ notebookId, sources, selection, full }: PickTabProps & { notebookId: string }) {
  const t = useT("notebooks")
  const outline = useCourseSteps(notebookId)
  const added = new Set(
    sources.filter((source) => source.kind === "lms_step").map((source) => refValue(source, "step_id")),
  )

  if (outline.isPending) return <StateView state="loading" rows={3} />
  if (outline.isError) return <StateView state="error" error={outline.error} onRetry={() => void outline.refetch()} />
  const course = outline.data
  const sections = course.sections.filter((section) => section.steps.length > 0)
  if (sections.length === 0) return <StateView state="empty" emptyText={t("add.courseSteps.empty")} />
  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-xs">{t("add.courseSteps.note")}</p>
      {sections.map((section) => (
        <section key={section.id} className="flex flex-col gap-1.5">
          <h4 className="text-muted-foreground text-xs font-medium">{section.title}</h4>
          <ul className="flex flex-col gap-1.5">
            {section.steps.map((step) => {
              const key = `lms-draft:${step.id}`
              const already = step.added || added.has(step.id)
              const checked = already || selection.has(key)
              return (
                <PickRow
                  key={step.id}
                  label={step.title}
                  note={already ? t("add.alreadyAdded") : undefined}
                  icon={<SourceKindIcon kind="lms_step" />}
                  checked={checked}
                  disabled={already || (full && !checked)}
                  onToggle={() =>
                    selection.toggle({
                      key,
                      input: { kind: "lms_step", course_id: course.course_id, step_id: step.id, draft: true },
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
