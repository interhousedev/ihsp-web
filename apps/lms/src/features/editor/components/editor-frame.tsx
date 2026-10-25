"use client"

import { getLmsCourseDraftQuery } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { PageContainer, StateView } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { AccessDenied } from "../../shared/components/access-denied"
import { useCoursePermissions } from "../../shared/hooks/use-course-permissions"
import { hrefs } from "../../shared/utils/hrefs"
import { can, type CoursePermission } from "../../shared/utils/permissions"
import { EditorNav, type EditorSection } from "./editor-nav"

/**
 * The frame of every `/edit/*` page: title, the course tools row and the permission check (`requires` lists the
 * permissions of which one is enough; without it any staff permission is).
 */
export function EditorFrame({
  courseId,
  current,
  title,
  description,
  actions,
  requires,
  children,
}: {
  courseId: string
  current: EditorSection
  title: string
  description?: string
  actions?: ReactNode
  requires?: readonly CoursePermission[]
  children: (permissions: readonly CoursePermission[]) => ReactNode
}) {
  const t = useT("editorNav")
  const { permissions, isPending } = useCoursePermissions(courseId)
  const readsDraft = can(permissions, "edit") || can(permissions, "view_drafts")
  const draft = useQuery({ ...getLmsCourseDraftQuery(courseId), enabled: readsDraft, retry: false })

  if (isPending) {
    return (
      <div className="px-4 pt-4 md:px-6">
        <StateView state="loading" />
      </div>
    )
  }
  const allowed = requires ? requires.some((permission) => can(permissions, permission)) : permissions.length > 0
  if (!allowed) return <AccessDenied backHref={hrefs.myCourses()} />

  return (
    <PageContainer title={title} description={description ?? draft.data?.title ?? t("courseTools")} actions={actions}>
      <EditorNav courseId={courseId} current={current} permissions={permissions} />
      {children(permissions)}
    </PageContainer>
  )
}
