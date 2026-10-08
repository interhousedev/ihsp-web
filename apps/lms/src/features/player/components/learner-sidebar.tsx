"use client"

import type { OutlineSection } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { lessonNumbers } from "../../shared/utils/outline"
import type { CourseProgress } from "../../shared/utils/course-progress"
import { SidebarFooter, type SidebarLink } from "./sidebar-footer"
import { SidebarLesson } from "./sidebar-lesson"
import { SidebarModule } from "./sidebar-module"
import { SidebarProgress } from "./sidebar-progress"

/**
 * The dark course sidebar of the lesson player (also the content of the phone drawer): the course title and progress,
 * the modules with their numbered lessons, and the full screen and settings buttons.
 */
export function LearnerSidebar({
  title,
  progress,
  outline,
  unavailable,
  currentStepId,
  hrefFor,
  links,
}: {
  title: string | null
  progress: CourseProgress | null
  outline: readonly OutlineSection[] | null
  unavailable: boolean
  currentStepId: string
  hrefFor: (stepId: string) => string
  links: readonly SidebarLink[]
}) {
  const t = useT("player")
  const numbers = outline ? lessonNumbers(outline) : null

  return (
    <div className="flex h-full min-h-0 flex-col bg-(--stepik-sidebar) text-white">
      <div className="px-4 pt-4 pb-3">
        {title ? <p className="text-sm leading-snug font-bold break-words">{title}</p> : null}
        {progress ? <SidebarProgress progress={progress} /> : null}
      </div>
      <nav aria-label={t("contents")} className="min-h-0 flex-1 overflow-y-auto pb-4">
        {unavailable ? (
          <p className="px-4 py-2 text-xs text-(--stepik-chrome-muted)">{t("sidebarUnavailable")}</p>
        ) : null}
        {outline && outline.length === 0 ? (
          <p className="px-4 py-2 text-xs text-(--stepik-chrome-muted)">{t("noLessons")}</p>
        ) : null}
        <ol>
          {outline?.map((section, index) => (
            <SidebarModule key={section.id} number={index + 1} title={section.title}>
              {section.steps.map((step) => (
                <li key={step.step_id}>
                  <SidebarLesson
                    number={numbers?.get(step.step_id) ?? ""}
                    title={step.title}
                    href={hrefFor(step.step_id)}
                    active={step.step_id === currentStepId}
                    completed={step.completed ?? false}
                    badge={step.badge ?? null}
                  />
                </li>
              ))}
            </SidebarModule>
          ))}
        </ol>
      </nav>
      <SidebarFooter links={links} />
    </div>
  )
}
