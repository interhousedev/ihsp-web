"use client"

import type { CoursePage } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Icons, cn } from "@ihsp/ui"
import Link from "next/link"
import { OutlineBadge, type OutlineBadgeKind } from "../../shared/components/outline-badge"
import { hrefs } from "../../shared/utils/hrefs"
import { lessonNumbers } from "../../shared/utils/outline"

/**
 * The syllabus of the course page, like Stepik's: numbered modules that fold, each with its numbered lessons, completion
 * marks and "new" / "changed" marks (UF-LMS-05). Lessons are links only for enrolled students and staff.
 */
export function CourseOutline({ page, linkSteps }: { page: CoursePage; linkSteps: boolean }) {
  const t = useT("course")
  const changed = new Set(page.changed_since_last_visit)
  const numbers = lessonNumbers(page.outline)

  if (page.outline.length === 0) return <p className="text-muted-foreground text-sm">{t("emptyOutline")}</p>

  return (
    <ol className="flex flex-col gap-3">
      {page.outline.map((section, sectionIndex) => (
        <li key={section.id}>
          <details open className="group rounded-lg border">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 px-4 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
              <Icons.chevronRight
                aria-hidden
                className="text-muted-foreground size-4 transition-transform group-open:rotate-90"
              />
              <h3 className="min-w-0 flex-1 text-sm font-semibold break-words">
                <span className="text-muted-foreground me-2 tabular-nums">{sectionIndex + 1}</span>
                {section.title}
              </h3>
              <span className="text-muted-foreground shrink-0 text-xs">
                {t("moduleLessons", { count: section.steps.length })}
              </span>
            </summary>
            <ul className="flex flex-col divide-y border-t">
              {section.steps.map((step) => {
                const badge: OutlineBadgeKind | null = step.badge ?? (changed.has(step.step_id) ? "changed" : null)
                const content = (
                  <>
                    <span className="text-muted-foreground w-9 shrink-0 text-xs tabular-nums">
                      {numbers.get(step.step_id)}
                    </span>
                    <span className="min-w-0 flex-1 break-words">{step.title}</span>
                    <OutlineBadge kind={badge} />
                    {step.completed ? (
                      <Icons.circleCheck className="text-primary size-5 shrink-0" aria-label={t("completed")} />
                    ) : null}
                  </>
                )
                const className = "flex min-h-11 items-center gap-2 px-4 py-2 text-sm"
                return (
                  <li key={step.step_id}>
                    {linkSteps ? (
                      <Link
                        href={hrefs.step(page.id, step.step_id, page.slug)}
                        className={cn(className, "hover:bg-muted/60 focus-visible:bg-muted/60 outline-none")}
                      >
                        {content}
                      </Link>
                    ) : (
                      <div className={className}>{content}</div>
                    )}
                  </li>
                )
              })}
              {section.steps.length === 0 ? (
                <li className="text-muted-foreground px-4 py-2 text-sm">{t("emptySection")}</li>
              ) : null}
            </ul>
          </details>
        </li>
      ))}
    </ol>
  )
}
