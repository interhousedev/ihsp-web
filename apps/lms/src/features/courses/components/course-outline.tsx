"use client"

import type { CoursePage } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Icons, cn } from "@ihsp/ui"
import Link from "next/link"
import { OutlineBadge, type OutlineBadgeKind } from "../../shared/components/outline-badge"
import { hrefs } from "../../shared/utils/hrefs"

/**
 * The outline of the course page: sections and steps with completion marks and "new" / "changed" marks (UF-LMS-05).
 * Steps are links only for enrolled students and staff.
 */
export function CourseOutline({ page, linkSteps }: { page: CoursePage; linkSteps: boolean }) {
  const t = useT("course")
  const changed = new Set(page.changed_since_last_visit)

  if (page.outline.length === 0) return <p className="text-muted-foreground text-sm">{t("emptyOutline")}</p>

  return (
    <ol className="flex flex-col gap-4">
      {page.outline.map((section) => (
        <li key={section.id}>
          <h3 className="mb-2 text-sm font-semibold">{section.title}</h3>
          <ul className="flex flex-col divide-y rounded-lg border">
            {section.steps.map((step) => {
              const badge: OutlineBadgeKind | null = step.badge ?? (changed.has(step.step_id) ? "changed" : null)
              const content = (
                <>
                  {step.completed ? (
                    <Icons.circleCheck className="text-primary size-5 shrink-0" aria-label={t("completed")} />
                  ) : (
                    <Icons.circle className="text-muted-foreground size-5 shrink-0" aria-hidden />
                  )}
                  <span className="min-w-0 flex-1 break-words">{step.title}</span>
                  <OutlineBadge kind={badge} />
                </>
              )
              const className = cn("flex min-h-11 items-center gap-3 px-3 py-2 text-sm")
              return (
                <li key={step.step_id}>
                  {linkSteps ? (
                    <Link
                      href={hrefs.step(page.id, step.step_id, page.slug)}
                      className={cn(className, "hover:bg-muted/60")}
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
              <li className="text-muted-foreground px-3 py-2 text-sm">{t("emptySection")}</li>
            ) : null}
          </ul>
        </li>
      ))}
    </ol>
  )
}
