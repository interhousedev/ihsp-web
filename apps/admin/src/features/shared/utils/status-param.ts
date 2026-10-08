import type { UserStatus } from "@ihsp/api"

const USER_STATUSES: readonly UserStatus[] = [
  "active",
  "blocked",
  "deactivated",
  "deleted",
  "pending_activation",
  "unregistered",
]

/** A `status` filter from the URL as the typed query value; an unknown value means "no filter". */
export function userStatusParam(value: string | null | undefined): UserStatus | undefined {
  return USER_STATUSES.find((status) => status === value)
}

/** The `status` filter of the student list. */
export function studentStatusParam(value: string | null | undefined): "active" | "left" | undefined {
  return value === "active" || value === "left" ? value : undefined
}

/** The `emis_status` filter of the student list. */
export function emisStatusParam(value: string | null | undefined): "active" | "needs_reauth" | undefined {
  return value === "active" || value === "needs_reauth" ? value : undefined
}
