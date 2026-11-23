// LMS engagement: XP, level, streak, daily review, mastery and quests (learner), and the course settings (staff).

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type { NoContent } from "../types/common"
import type {
  CourseMastery,
  EngagementSettings,
  EngagementSummary,
  Quest,
  QuestBody,
  QuestList,
  ReviewAnswerBody,
  ReviewAnswerResult,
  ReviewGradeRating,
  ReviewGradeResult,
  ReviewList,
  XpHistory,
} from "../types/lms-engagement"

/** GET /v1/lms/engagement/summary — learner; XP, level and the school-day streak. */
export function getLmsEngagementSummary(opts?: RequestOptions): Promise<EngagementSummary> {
  return api.get<EngagementSummary>("/v1/lms/engagement/summary", opts)
}
export const getLmsEngagementSummaryQuery = () =>
  queryOptions({
    queryKey: keys.lms.engagementSummary(),
    queryFn: ({ signal }) => getLmsEngagementSummary({ signal }),
  })

/** GET /v1/lms/engagement/xp — learner; the latest XP events. */
export function getLmsEngagementXp(params?: { limit?: number }, opts?: RequestOptions): Promise<XpHistory> {
  return api.get<XpHistory>("/v1/lms/engagement/xp", { ...opts, query: params })
}

/** GET /v1/lms/engagement/review — learner; today's review items (at most 20). */
export function getLmsEngagementReview(opts?: RequestOptions): Promise<ReviewList> {
  return api.get<ReviewList>("/v1/lms/engagement/review", opts)
}
export const getLmsEngagementReviewQuery = () =>
  queryOptions({
    queryKey: keys.lms.engagementReview(),
    queryFn: ({ signal }) => getLmsEngagementReview({ signal }),
  })

/** POST /v1/lms/engagement/review/{item_id}/answer — learner; checks a question item. */
export function postLmsEngagementReviewAnswer(
  itemId: string,
  body: ReviewAnswerBody,
  opts?: RequestOptions,
): Promise<ReviewAnswerResult> {
  return api.post<ReviewAnswerResult>(`/v1/lms/engagement/review/${seg(itemId)}/answer`, body, opts)
}

/** POST /v1/lms/engagement/review/{item_id}/grade — learner; rates a flashcard item (FSRS 1..4). */
export function postLmsEngagementReviewGrade(
  itemId: string,
  rating: ReviewGradeRating,
  opts?: RequestOptions,
): Promise<ReviewGradeResult> {
  return api.post<ReviewGradeResult>(`/v1/lms/engagement/review/${seg(itemId)}/grade`, { rating }, opts)
}

/** GET /v1/lms/engagement/courses/{course_id}/mastery — learner. */
export function getLmsEngagementMastery(courseId: string, opts?: RequestOptions): Promise<CourseMastery> {
  return api.get<CourseMastery>(`/v1/lms/engagement/courses/${seg(courseId)}/mastery`, opts)
}
export const getLmsEngagementMasteryQuery = (courseId: string) =>
  queryOptions({
    queryKey: keys.lms.engagementMastery(courseId),
    queryFn: ({ signal }) => getLmsEngagementMastery(courseId, { signal }),
  })

/** GET /v1/lms/engagement/quests — learner. */
export function getLmsEngagementQuests(opts?: RequestOptions): Promise<QuestList> {
  return api.get<QuestList>("/v1/lms/engagement/quests", opts)
}
export const getLmsEngagementQuestsQuery = () =>
  queryOptions({
    queryKey: keys.lms.engagementQuests(),
    queryFn: ({ signal }) => getLmsEngagementQuests({ signal }),
  })

/** GET /v1/lms/courses/{course_id}/engagement-settings — course staff (review). */
export function getLmsEngagementSettings(courseId: string, opts?: RequestOptions): Promise<EngagementSettings> {
  return api.get<EngagementSettings>(`/v1/lms/courses/${seg(courseId)}/engagement-settings`, opts)
}
export const getLmsEngagementSettingsQuery = (courseId: string) =>
  queryOptions({
    queryKey: keys.lms.engagementSettings(courseId),
    queryFn: ({ signal }) => getLmsEngagementSettings(courseId, { signal }),
  })

/** PUT /v1/lms/courses/{course_id}/engagement-settings — course staff; `null` turns unlock-at-mastery off. */
export function putLmsEngagementSettings(
  courseId: string,
  body: EngagementSettings,
  opts?: RequestOptions,
): Promise<EngagementSettings> {
  return api.put<EngagementSettings>(`/v1/lms/courses/${seg(courseId)}/engagement-settings`, body, opts)
}

/** GET /v1/lms/courses/{course_id}/quests — course staff. */
export function getLmsCourseQuests(courseId: string, opts?: RequestOptions): Promise<QuestList> {
  return api.get<QuestList>(`/v1/lms/courses/${seg(courseId)}/quests`, opts)
}
export const getLmsCourseQuestsQuery = (courseId: string) =>
  queryOptions({
    queryKey: keys.lms.courseQuests(courseId),
    queryFn: ({ signal }) => getLmsCourseQuests(courseId, { signal }),
  })

/** POST /v1/lms/courses/{course_id}/quests — course staff. */
export function postLmsCourseQuest(courseId: string, body: QuestBody, opts?: RequestOptions): Promise<Quest> {
  return api.post<Quest>(`/v1/lms/courses/${seg(courseId)}/quests`, body, opts)
}

/** PATCH /v1/lms/courses/{course_id}/quests/{quest_id} — course staff. */
export function patchLmsCourseQuest(
  courseId: string,
  questId: string,
  body: QuestBody,
  opts?: RequestOptions,
): Promise<Quest> {
  return api.patch<Quest>(`/v1/lms/courses/${seg(courseId)}/quests/${seg(questId)}`, body, opts)
}

/** DELETE /v1/lms/courses/{course_id}/quests/{quest_id} — course staff. */
export function deleteLmsCourseQuest(courseId: string, questId: string, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/lms/courses/${seg(courseId)}/quests/${seg(questId)}`, opts)
}
