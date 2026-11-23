// LMS engagement: XP, levels, school-day streaks, daily review, quests and mastery (`/v1/lms/engagement`).

import type { components } from "../generated/openapi"
import type { Answer, AttemptView } from "./lms-learning"

type S = components["schemas"]

/** One day of the Mon-Fri streak strip (weekends show as `bonus` when the learner studied). */
export type StreakDay = S["EngagementWeekDayView"]
export type StreakDayState = StreakDay["state"]

export type EngagementStreak = S["EngagementStreakView"]

/** GET /v1/lms/engagement/summary. Level `L` needs `50 * L * (L - 1)` XP in total. */
export type EngagementSummary = S["EngagementSummaryView"]

export type XpEvent = S["EngagementXpItemView"]
export type XpSource = XpEvent["source"]

/** GET /v1/lms/engagement/xp. */
export type XpHistory = S["EngagementXpListView"]

export type MasteryStep = S["EngagementMasteryStepView"]
export type MasterySection = S["EngagementMasterySectionView"]

/** GET /v1/lms/engagement/courses/{course_id}/mastery. */
export type CourseMastery = S["EngagementMasteryView"]

/** A class quest with the learner's and the class's progress (learner list and staff editor alike). */
export type Quest = S["EngagementQuestView"]
export type QuestGoalKind = Quest["goal_kind"]

/** GET /v1/lms/engagement/quests and GET /v1/lms/courses/{course_id}/quests. */
export type QuestList = S["EngagementQuestListView"]

/** The writable fields of a course quest. */
export type QuestBody = S["EngagementQuestInput"]

export type ReviewItemKind = S["EngagementReviewItemView"]["kind"]

/**
 * The schema types `question` as a free-form object: it carries the learner test question shape (no correct answer).
 * The card is set for flashcards.
 */
export type ReviewItem = Omit<S["EngagementReviewItemView"], "question"> & {
  question: AttemptView["questions"][number] | null
}

/** GET /v1/lms/engagement/review: at most 20 items per day. */
export type ReviewList = { items: ReviewItem[] }

export type ReviewAnswerBody = { answer: Answer }

/** POST /v1/lms/engagement/review/{item_id}/answer; the schema types `correct_answer` as a free-form object. */
export type ReviewAnswerResult = Omit<S["EngagementAnswerResultView"], "correct_answer"> & {
  correct_answer: Answer | null
}

/** FSRS rating: 1 again, 2 hard, 3 good, 4 easy. */
export type ReviewGradeRating = 1 | 2 | 3 | 4

/** POST /v1/lms/engagement/review/{item_id}/grade. */
export type ReviewGradeResult = S["EngagementGradeResultView"]

/** GET/PUT /v1/lms/courses/{course_id}/engagement-settings; `null` turns unlock-at-mastery off. */
export type EngagementSettings = { unlock_threshold_pct: number | null }
