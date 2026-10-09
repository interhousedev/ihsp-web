import type { Role } from "@ihsp/api"

export type PlatformKey = "sp" | "staff" | "admin" | "lms" | "library" | "id"

/** Display order of the platforms in the profile menu. */
const ORDER: readonly PlatformKey[] = ["sp", "staff", "admin", "lms", "library", "id"]

const BY_ROLE: Record<Role, readonly PlatformKey[]> = {
  student: ["sp", "lms", "library", "id"],
  teacher: ["staff", "lms", "library", "id"],
  admin: ["admin", "lms", "library", "id"],
  lms_admin: ["lms", "library", "id"],
  librarian: ["library", "id"],
}

/**
 * The platforms a user with these roles can open: a student SP, a teacher Staff, an admin Admin (and Staff when the
 * admin also teaches), everybody LMS and the Library, and their account (ID). Several roles add up; the account is always there.
 */
export function platformKeysFor(roles: readonly Role[]): PlatformKey[] {
  const wanted = new Set<PlatformKey>(["id"])
  for (const role of roles) for (const key of BY_ROLE[role] ?? []) wanted.add(key)
  return ORDER.filter((key) => wanted.has(key))
}
