import type { BadgePublic, CourseBadge, CourseBadgeBody, EarnedBadge, MyBadges, UserBadges } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { apiUrl, noContent, param, readJson } from "./utils"

const COURSE = "0190a000-0000-4000-8000-0000000000c1"

export const badgePublicFixture: BadgePublic = {
  id: "0190a000-0000-4000-8000-0000000000b1",
  name: { en: "First steps", ru: "Первые шаги", uz: "Birinchi qadamlar" },
  description: { en: "Finish your first step.", ru: "Пройдите первый шаг.", uz: "Birinchi qadamni tugating." },
  design: { color: "#f59e0b", icon: "star", shape: "circle", image_url: null },
}

export const earnedBadgeFixture: EarnedBadge = {
  award_id: "0190a000-0000-4000-8000-0000000000b2",
  awarded_at: "2026-01-12T09:00:00Z",
  course_id: COURSE,
  course_title: "Algebra I",
  badge: badgePublicFixture,
}

export const myBadgesFixture: MyBadges = {
  earned: [earnedBadgeFixture],
  locked: [],
  unseen: [earnedBadgeFixture.award_id],
}

function courseBadge(courseId: string, badgeId: string, body: Partial<CourseBadgeBody>): CourseBadge {
  return {
    id: badgeId,
    course_id: courseId,
    created_at: "2026-01-10T09:00:00Z",
    awarded_count: 0,
    name: body.name ?? badgePublicFixture.name,
    description: body.description ?? badgePublicFixture.description,
    design: body.design ?? badgePublicFixture.design,
    rule: body.rule ?? { event: "step_completed", condition: null },
  }
}

export const lmsBadgesHandlers = [
  http.get(apiUrl("/v1/lms/badges/mine"), () => HttpResponse.json(myBadgesFixture)),
  http.post(apiUrl("/v1/lms/badges/awards/:awardId/seen"), () => noContent()),
  http.get(apiUrl("/v1/lms/users/:userId/badges"), () => {
    const body: UserBadges = { earned: [earnedBadgeFixture] }
    return HttpResponse.json(body)
  }),
  http.put(apiUrl("/v1/lms/courses/:courseId/badge-settings"), async ({ request }) => {
    const { show_locked } = await readJson<{ show_locked: boolean }>(request)
    return HttpResponse.json({ show_locked: Boolean(show_locked) })
  }),
  http.post(apiUrl("/v1/lms/courses/:courseId/badges/:badgeId/image"), ({ params }) =>
    HttpResponse.json(
      courseBadge(param(params, "courseId"), param(params, "badgeId"), {
        design: { ...badgePublicFixture.design, image_url: `/v1/lms/badges/${param(params, "badgeId")}/image.png` },
      }),
    ),
  ),
  http.put(apiUrl("/v1/lms/courses/:courseId/badges/:badgeId"), async ({ request, params }) =>
    HttpResponse.json(
      courseBadge(param(params, "courseId"), param(params, "badgeId"), await readJson<CourseBadgeBody>(request)),
    ),
  ),
  http.delete(apiUrl("/v1/lms/courses/:courseId/badges/:badgeId"), () => noContent()),
]
