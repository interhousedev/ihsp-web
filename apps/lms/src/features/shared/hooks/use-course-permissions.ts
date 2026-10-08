"use client"

import { getLmsCourseStaffQuery } from "@ihsp/api"
import { useSession } from "@ihsp/auth"
import { useQuery } from "@tanstack/react-query"
import { resolvePermissions, type CoursePermission } from "../utils/permissions"

/**
 * What the logged-in user may do in a course: LMS admins everything, others what their staff row says. Pages use it to
 * hide actions; the server still checks every request.
 */
export function useCoursePermissions(courseId: string | null): {
  permissions: CoursePermission[]
  isPending: boolean
} {
  const { session } = useSession()
  const isAdmin = session?.user.roles.includes("lms_admin") ?? false
  const staff = useQuery({ ...getLmsCourseStaffQuery(courseId ?? ""), enabled: courseId !== null && !isAdmin })
  return {
    permissions: resolvePermissions(staff.data, session?.user),
    isPending: !isAdmin && courseId !== null && staff.isPending,
  }
}
