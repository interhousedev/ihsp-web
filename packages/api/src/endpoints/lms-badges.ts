// Course badges (`/v1/lms/courses/{course_id}/badges`): staff design and the visual rule, learner awards and profiles.

import type { components } from "../generated/openapi"
import { api } from "../client"
import { queryOptions, seg, type RequestOptions } from "../query"

type S = components["schemas"]

export type BadgeIcon = S["BadgeIcon"]
export type BadgeShape = S["BadgeShape"]
export type BadgeEvent = S["BadgeEvent"]

export const BADGE_ICONS = [
  "star",
  "trophy",
  "medal",
  "flame",
  "book",
  "rocket",
  "bolt",
  "heart",
  "crown",
  "target",
  "brain",
  "check",
] as const satisfies readonly BadgeIcon[]
export const BADGE_SHAPES = ["circle", "shield", "hexagon", "star"] as const satisfies readonly BadgeShape[]
export const BADGE_EVENTS = [
  "step_completed",
  "section_completed",
  "test_passed",
  "exam_scored",
  "streak_reached",
  "course_completed",
  "reviews_done",
] as const satisfies readonly BadgeEvent[]

/** The server always sends the three languages (the schema marks them optional because they default to ""). */
export type BadgeLabels = Required<S["LocalizedText"]>

export type BadgeDesign = Required<S["BadgeDesignView"]>

/** The schema types the rule as a free-form object; this is the visual rule the backend validates. */
export type BadgeCondition =
  | { op: "and" | "or"; children: BadgeCondition[] }
  | { op: "not"; child: BadgeCondition }
  | { op: "score_gte" | "count_gte" | "within_days_of_enroll"; value: number }
  | { op: "section_is"; section_id: string }
  | { op: "step_is"; step_id: string }

export type BadgeRule = { event: BadgeEvent; condition: BadgeCondition | null }

type Typed<T> = Omit<T, "name" | "description" | "design"> & {
  name: BadgeLabels
  description: BadgeLabels
  design: BadgeDesign
}

export type CourseBadge = Omit<Typed<S["BadgeView"]>, "rule"> & { rule: BadgeRule }

export type CourseBadgeBody = Pick<CourseBadge, "name" | "description" | "design" | "rule">

export type CourseBadgeList = Omit<S["BadgeListView"], "items"> & { items: CourseBadge[] }

export type BadgePublic = Typed<S["BadgePublicView"]>

export type LockedBadge = Omit<S["LockedBadgeView"], "badge"> & { badge: BadgePublic }

/** `award_id` matches the ids in `MyBadges.unseen`. */
export type EarnedBadge = Omit<S["EarnedBadgeView"], "badge"> & { badge: BadgePublic }

export type MyBadges = Omit<S["MyBadgesView"], "earned" | "locked"> & { earned: EarnedBadge[]; locked: LockedBadge[] }

export type UserBadges = { earned: EarnedBadge[] }

export const badgeKeys = {
  course: (courseId: string) => ["lms", "badges", "course", courseId] as const,
  mine: () => ["lms", "badges", "mine"] as const,
  user: (userId: string) => ["lms", "badges", "user", userId] as const,
}

/** An API-relative address (`/v1/...`) as an absolute one, for `<img src>`; other values are returned as is. */
export function badgeAssetUrl(path: string): string {
  return path.startsWith("/v1/") ? api.url(path) : path
}

const P = (courseId: string) => `/v1/lms/courses/${seg(courseId)}/badges`

/** GET /v1/lms/courses/{course_id}/badges — course writers. */
export function getCourseBadges(courseId: string, opts?: RequestOptions): Promise<CourseBadgeList> {
  return api.get<CourseBadgeList>(P(courseId), opts)
}
export const getCourseBadgesQuery = (courseId: string) =>
  queryOptions({ queryKey: badgeKeys.course(courseId), queryFn: ({ signal }) => getCourseBadges(courseId, { signal }) })

/** POST /v1/lms/courses/{course_id}/badges. */
export function postCourseBadge(courseId: string, body: CourseBadgeBody, opts?: RequestOptions): Promise<CourseBadge> {
  return api.post<CourseBadge>(P(courseId), body, opts)
}

/** PUT /v1/lms/courses/{course_id}/badges/{badge_id}. */
export function putCourseBadge(
  courseId: string,
  badgeId: string,
  body: CourseBadgeBody,
  opts?: RequestOptions,
): Promise<CourseBadge> {
  return api.put<CourseBadge>(`${P(courseId)}/${seg(badgeId)}`, body, opts)
}

/** DELETE /v1/lms/courses/{course_id}/badges/{badge_id}. */
export function deleteCourseBadge(courseId: string, badgeId: string, opts?: RequestOptions): Promise<void> {
  return api.delete<void>(`${P(courseId)}/${seg(badgeId)}`, opts)
}

/** POST /v1/lms/courses/{course_id}/badges/{badge_id}/image — PNG, JPEG or WebP (multipart). */
export function postCourseBadgeImage(
  courseId: string,
  badgeId: string,
  file: File,
  opts?: RequestOptions,
): Promise<CourseBadge> {
  const form = new FormData()
  form.append("file", file)
  return api.request<CourseBadge>({
    ...opts,
    method: "POST",
    path: `${P(courseId)}/${seg(badgeId)}/image`,
    formData: form,
  })
}

/** PUT /v1/lms/courses/{course_id}/badge-settings. */
export function putCourseBadgeSettings(
  courseId: string,
  body: { show_locked: boolean },
  opts?: RequestOptions,
): Promise<{ show_locked: boolean }> {
  return api.put<{ show_locked: boolean }>(`/v1/lms/courses/${seg(courseId)}/badge-settings`, body, opts)
}

/** GET /v1/lms/badges/mine — the learner's earned, locked (where shown) and unseen awards. */
export function getMyBadges(opts?: RequestOptions): Promise<MyBadges> {
  return api.get<MyBadges>("/v1/lms/badges/mine", opts)
}
export const getMyBadgesQuery = () =>
  queryOptions({ queryKey: badgeKeys.mine(), queryFn: ({ signal }) => getMyBadges({ signal }) })

/** POST /v1/lms/badges/awards/{award_id}/seen. */
export function postBadgeAwardSeen(awardId: string, opts?: RequestOptions): Promise<void> {
  return api.post<void>(`/v1/lms/badges/awards/${seg(awardId)}/seen`, undefined, opts)
}

/** GET /v1/lms/users/{user_id}/badges — the earned badges on an LMS profile. */
export function getUserBadges(userId: string, opts?: RequestOptions): Promise<UserBadges> {
  return api.get<UserBadges>(`/v1/lms/users/${seg(userId)}/badges`, opts)
}
export const getUserBadgesQuery = (userId: string) =>
  queryOptions({ queryKey: badgeKeys.user(userId), queryFn: ({ signal }) => getUserBadges(userId, { signal }) })
