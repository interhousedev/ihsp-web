import type { CourseStaffItem, Role } from "@ihsp/api"

export type CoursePermission = CourseStaffItem["permissions"][number]

export const ALL_PERMISSIONS: readonly CoursePermission[] = ["edit", "publish", "review", "manage_staff", "view_drafts"]

/** Role presets of the staff form (LMS-5): the role text and the permissions it fills in. */
export const ROLE_PRESETS = [
  { key: "owner", role: "Owner", permissions: ALL_PERMISSIONS },
  { key: "teacher", role: "Teacher", permissions: ["edit", "publish", "review", "view_drafts"] },
  { key: "reviewer", role: "Reviewer", permissions: ["review"] },
  { key: "support", role: "Support", permissions: ["review"] },
  { key: "tester", role: "Tester", permissions: ["view_drafts"] },
] as const satisfies readonly { key: string; role: string; permissions: readonly CoursePermission[] }[]

/** LMS admins can do everything; other users have the permissions of their staff row. */
export function resolvePermissions(
  staff: readonly CourseStaffItem[] | undefined,
  user: { id: string; roles: readonly Role[] } | null | undefined,
): CoursePermission[] {
  if (!user) return []
  if (user.roles.includes("lms_admin")) return [...ALL_PERMISSIONS]
  return staff?.find((item) => item.user.id === user.id)?.permissions ?? []
}

export function can(permissions: readonly string[] | undefined, permission: CoursePermission): boolean {
  return permissions?.includes(permission) ?? false
}
