"use client"

import { getLmsCourseStaffQuery, isApiError } from "@ihsp/api"
import { useSession } from "@ihsp/auth"
import { useQuery } from "@tanstack/react-query"
import { resolvePermissions, type CoursePermission } from "../utils/permissions"

/**
 * What the logged-in user may do in a course: LMS admins everything, others what their staff row says. Pages use it to
 * hide actions; the server still checks every request. A refused list (403) means no permissions; any other failure
 * is `isError`, so the page can offer a retry instead of claiming the user has no access.
 */
export function useCoursePermissions(courseId: string | null): {
  permissions: CoursePermission[]
  isPending: boolean
  isError: boolean
  refetch: () => void
} {
  const { session } = useSession()
  const isAdmin = session?.user.roles.includes("lms_admin") ?? false
  const staff = useQuery({
    ...getLmsCourseStaffQuery(courseId ?? ""),
    enabled: courseId !== null && !isAdmin,
  })
  const refused = isApiError(staff.error) && staff.error.status === 403
  return {
    permissions: resolvePermissions(staff.data, session?.user),
    isPending: !isAdmin && courseId !== null && staff.isPending,
    isError: !isAdmin && courseId !== null && staff.isError && !refused,
    refetch: () => void staff.refetch(),
  }
}
