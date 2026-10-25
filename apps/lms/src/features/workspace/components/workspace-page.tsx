"use client"

import { NotebookWorkspace, useOpenCourseWorkspace } from "@ihsp/features-core"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { StateView } from "@ihsp/ui"
import { useEffect } from "react"
import { AccessDenied } from "../../shared/components/access-denied"
import { useCoursePermissions } from "../../shared/hooks/use-course-permissions"
import { hrefs } from "../../shared/utils/hrefs"
import { can } from "../../shared/utils/permissions"

/**
 * `/edit/workspace/?id=`: the AI workspace of a course (a notebook that belongs to the course). Staff with `edit` read
 * and write it; staff with `view_drafts` only read; everyone else is refused. The workspace is opened (created on
 * first use) once the permissions are known, then the notebook workspace of `@ihsp/features-core` takes over.
 */
export function WorkspacePage({ courseId }: { courseId: string }) {
  const t = useT("workspace")
  const errorMessage = useErrorMessage()
  const { permissions, isPending } = useCoursePermissions(courseId)
  const allowed = can(permissions, "edit") || can(permissions, "view_drafts")
  const open = useOpenCourseWorkspace()
  const { mutate, isIdle } = open

  useEffect(() => {
    if (!isPending && allowed && isIdle) mutate(courseId)
  }, [isPending, allowed, isIdle, mutate, courseId])

  if (isPending) return <StateView state="loading" rows={4} className="m-4" />
  if (!allowed) return <AccessDenied backHref={hrefs.edit(courseId)} />
  if (open.isError) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center p-4">
        <p role="alert" className="text-destructive mb-3 text-sm">
          {t("openFailed")}: {errorMessage(open.error)}
        </p>
        <StateView state="error" error={open.error} onRetry={() => open.mutate(courseId)} />
      </div>
    )
  }
  if (!open.data) return <StateView state="loading" rows={4} className="m-4" />
  return <NotebookWorkspace notebookId={open.data.notebook_id} notFoundHref={hrefs.edit(courseId)} />
}
