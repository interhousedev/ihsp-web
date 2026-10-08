// Shared primitives of backend/FINAL_PLAN.md § API contract → Conventions and Schemas.

export type Role = "student" | "teacher" | "admin" | "lms_admin"

export type PersonRef = { id: string; first_name: string; last_name: string }
/** `name` is in the caller's locale with fallback uz -> ru -> en. */
/** `short_name` is null for subjects created without one (admin timetable responses). */
export type SubjectRef = { id: string; name: string; short_name: string | null }
/** Student and composition views can send `null` for `name` and `slug` (the room is not shown to them). */
export type RoomRefLite = { id: string; slug: string | null; name: string | null }

/** `Page<T>` with `?cursor=&limit=` (default 20, max 100). */
export type Page<T> = { items: T[]; next_cursor: string | null }
export type PageParams = { cursor?: string; limit?: number }

/** `?from=&to=` date range (`YYYY-MM-DD`). */
export type DateRangeParams = { from?: string; to?: string }

/** Marker for `202`/`204` responses without a body. */
export type NoContent = void

/** `{redirect_to}` returned by Hydra challenge endpoints. */
export type RedirectResponse = { redirect_to: string }

/** `ReviewRating` is shared by personal flash cards and LMS card blocks. */
export type ReviewRating = "again" | "hard" | "medium" | "easy"

/** Marks and attendance state of a student at a lesson. */
export type AttendanceState = "present" | "absent" | "excused" | "not_taken"

/** Subgroup number of a group, or no subgroup. */
export type Subgroup = 1 | 2 | null
