import { api, seg } from "@ihsp/api"

/**
 * Typed adapter of the club ↔ course link routes of `/v1/activities` (the contract types their bodies as open objects, and
 * `packages/api` has no activities module yet). Move these functions there when it grows one.
 * A link is two-party: the side that asks waits (`pending`) until the other side confirms (`active`).
 */
export type ClubCourseLink = {
  id: string
  club_id: string
  course_id: string
  requested_by: string
  requested_side: "club" | "course"
  status: "pending" | "active" | string
  requested_at: string
  confirmed_by: string | null
  confirmed_at: string | null
}

/** A club of the caller; `name` is a plain string or a per-locale map. */
export type MyClub = { id: string; slug: string; name: string | Record<string, string>; status?: string }

export const clubName = (name: MyClub["name"], locale: string): string =>
  typeof name === "string" ? name : (name[locale] ?? name.ru ?? Object.values(name)[0] ?? "")

type Items<T> = { items: T[] }

export const clubCourseKeys = {
  course: (courseId: string) => ["activities", "course-clubs", courseId] as const,
  club: (clubId: string) => ["activities", "club-courses", clubId] as const,
  mine: () => ["activities", "my-clubs"] as const,
}

/** GET /v1/activities/courses/{course_id}/clubs — active links; the course staff also see pending ones. */
export async function getCourseClubLinks(courseId: string): Promise<ClubCourseLink[]> {
  return (await api.get<Items<ClubCourseLink>>(`/v1/activities/courses/${seg(courseId)}/clubs`)).items
}

/** GET /v1/activities/clubs/{club_id}/courses — active links; the owner also sees pending ones. */
export async function getClubCourseLinks(clubId: string): Promise<ClubCourseLink[]> {
  return (await api.get<Items<ClubCourseLink>>(`/v1/activities/clubs/${seg(clubId)}/courses`)).items
}

/** GET /v1/activities/clubs/mine — clubs the caller belongs to. */
export async function getMyClubs(): Promise<MyClub[]> {
  return (await api.get<Items<MyClub>>("/v1/activities/clubs/mine")).items
}

/** POST /v1/activities/clubs/{club_id}/courses — ask for the link; active at once when the caller holds both sides. */
export function requestClubCourseLink(clubId: string, courseId: string): Promise<ClubCourseLink> {
  return api.post<ClubCourseLink>(`/v1/activities/clubs/${seg(clubId)}/courses`, { course_id: courseId })
}

/** POST /v1/activities/clubs/{club_id}/courses/{course_id}:confirm — the other side accepts the request. */
export function confirmClubCourseLink(clubId: string, courseId: string): Promise<ClubCourseLink> {
  return api.post<ClubCourseLink>(`/v1/activities/clubs/${seg(clubId)}/courses/${seg(courseId)}:confirm`)
}

/** DELETE /v1/activities/clubs/{club_id}/courses/{course_id} — either side ends the link or declines a request. */
export function unlinkClubCourse(clubId: string, courseId: string): Promise<void> {
  return api.delete<void>(`/v1/activities/clubs/${seg(clubId)}/courses/${seg(courseId)}`)
}
