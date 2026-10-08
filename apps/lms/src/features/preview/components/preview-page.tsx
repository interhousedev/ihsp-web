"use client"

import { StateView } from "@ihsp/ui"
import { AccessDenied } from "../../shared/components/access-denied"
import { useCoursePermissions } from "../../shared/hooks/use-course-permissions"
import { hrefs } from "../../shared/utils/hrefs"
import { can } from "../../shared/utils/permissions"
import { StepPlayer } from "../../player/components/step-player"
import { PreviewIndex } from "./preview-index"

/** `/edit/preview/?id=&step=`: the player with the draft content under a "Preview" banner, for staff with `view_drafts`. */
export function PreviewPage({ courseId, stepId }: { courseId: string; stepId: string | null }) {
  const { permissions, isPending } = useCoursePermissions(courseId)
  if (isPending) {
    return (
      <div className="px-4 pt-4 md:px-6">
        <StateView state="loading" />
      </div>
    )
  }
  if (!can(permissions, "view_drafts")) return <AccessDenied backHref={hrefs.myCourses()} />
  if (!stepId) return <PreviewIndex courseId={courseId} />
  return <StepPlayer courseId={courseId} stepId={stepId} slug={null} mode="preview" />
}
