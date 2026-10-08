"use client"

import { getLmsCoursePreviewStepQuery, getLmsCourseStepQuery } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { QueryState } from "../../shared/components/query-state"
import { hrefs } from "../../shared/utils/hrefs"
import { lessonNumbers } from "../../shared/utils/outline"
import { useMarkViewed } from "../hooks/use-mark-viewed"
import { useStepOutline } from "../hooks/use-step-outline"
import { blockTargets, firstOpenBlock, resolveBlock, type NavTarget } from "../utils/block-nav"
import { courseProgress } from "../../shared/utils/course-progress"
import { LearnerFrame } from "./learner-frame"
import { LearnerSidebar } from "./learner-sidebar"
import { LessonFooter } from "./lesson-footer"
import { LessonHeader } from "./lesson-header"
import { PreviewBanner } from "./preview-banner"
import type { SidebarLink } from "./sidebar-footer"
import { StepContent } from "./step-content"
import { StepStrip } from "./step-strip"

/**
 * The lesson player (UF-LMS-03, UF-LMS-04) laid out like Stepik: the course sidebar, a strip with one square per step
 * (block) of the lesson, and the open step with a "Next step" button. `block` is the 1-based step from the address;
 * without it the first step not passed yet opens. `mode="preview"` shows the draft to staff with `view_drafts` under a
 * "Preview" banner.
 */
export function StepPlayer({
  courseId,
  stepId,
  slug,
  block = null,
  mode,
}: {
  courseId: string
  stepId: string
  slug: string | null
  block?: number | null
  mode: "learn" | "preview"
}) {
  const t = useT("player")
  const preview = mode === "preview"
  const step = useQuery(
    preview ? getLmsCoursePreviewStepQuery(courseId, stepId) : getLmsCourseStepQuery(courseId, stepId),
  )
  const around = useStepOutline({ courseId, slug, preview })
  useMarkViewed({ courseId, stepId, slug: around.slug, step: step.data, enabled: !preview })

  // Without `block` in the address the first step not passed opens, and stays open while the passes change.
  const [entry, setEntry] = useState<number | null>(null)
  useEffect(() => {
    if (step.data && entry === null) setEntry(firstOpenBlock(step.data.blocks))
  }, [step.data, entry])

  const blocks = step.data?.blocks ?? []
  const index = resolveBlock(block, blocks, entry)
  const courseSlug = around.slug

  const stepHref = (id: string, number?: number) =>
    preview ? hrefs.preview(courseId, id, number) : hrefs.step(courseId, id, courseSlug ?? undefined, number)
  const targetHref = (target: NavTarget) => stepHref(target.stepId, target.block ?? undefined)
  const backHref = preview ? hrefs.edit(courseId) : courseSlug ? hrefs.course(courseSlug) : hrefs.myCourses()

  const links: SidebarLink[] = preview
    ? [{ key: "editor", label: t("backToEditor"), href: hrefs.edit(courseId) }]
    : [
        ...(courseSlug ? [{ key: "course", label: t("coursePage"), href: hrefs.course(courseSlug) }] : []),
        ...(around.course?.can_edit ? [{ key: "edit", label: t("editCourse"), href: hrefs.edit(courseId) }] : []),
        { key: "my", label: t("myCourses"), href: hrefs.myCourses() },
      ]
  const numbers = around.outline ? lessonNumbers(around.outline) : null
  const { previous, next } = blockTargets({ stepId, index, total: blocks.length, outline: around.outline })

  return (
    <LearnerFrame
      strip={<StepStrip blocks={blocks} current={index} hrefFor={(position) => stepHref(stepId, position + 1)} />}
      sidebar={
        <LearnerSidebar
          title={around.courseTitle}
          progress={courseProgress(around.course)}
          outline={around.outline}
          unavailable={around.unavailable}
          currentStepId={stepId}
          hrefFor={(id) => stepHref(id)}
          links={links}
        />
      }
    >
      {preview ? <PreviewBanner backHref={backHref} /> : null}
      <QueryState query={step} rows={3}>
        {(data) => {
          const current = data.blocks[index]
          return (
            <>
              <LessonHeader number={numbers?.get(stepId) ?? null} step={data} />
              {current ? (
                <StepContent
                  block={current}
                  courseId={courseId}
                  stepId={stepId}
                  slug={around.slug}
                  preview={preview || data.preview}
                  focusKey={`${stepId}:${index}`}
                />
              ) : (
                <p className="text-muted-foreground px-4 py-5 text-sm md:px-6">{t("emptyStep")}</p>
              )}
              <LessonFooter previous={previous} next={next} hrefFor={targetHref} finishHref={backHref} />
            </>
          )
        }}
      </QueryState>
    </LearnerFrame>
  )
}
