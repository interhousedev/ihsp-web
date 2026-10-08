import type { FlashcardSetDetail, FlashcardSetItem, FlashcardStats, StudyNext } from "@ihsp/api"
import { ids } from "./world"

export const flashcardCards: FlashcardSetDetail["cards"] = [
  {
    id: "0000000e-0000-4000-8000-000000000001",
    position: 1,
    front: "What is velocity?",
    back: "The rate of change of position: $v = \\Delta x / \\Delta t$.",
    state: "review",
    due_at: "2026-10-07T03:00:00Z",
  },
  {
    id: "0000000e-0000-4000-8000-000000000002",
    position: 2,
    front: "What is acceleration?",
    back: "The rate of change of velocity.",
    state: "learning",
    due_at: "2026-10-07T05:00:00Z",
  },
  {
    id: "0000000e-0000-4000-8000-000000000003",
    position: 3,
    front: "Uniform motion formula",
    back: "$x = x_0 + vt$",
    state: "new",
    due_at: null,
  },
  {
    id: "0000000e-0000-4000-8000-000000000004",
    position: 4,
    front: "Free fall acceleration on Earth",
    back: "$g \\approx 9.8\\ \\text{m/s}^2$",
    state: "new",
    due_at: null,
  },
]

export const flashcardSetPhysics: FlashcardSetItem = {
  id: ids.flashcardSet,
  title: "Physics: kinematics",
  description: "Key definitions and formulas",
  source: "manual",
  card_count: 4,
  due_today: 2,
  new_today: 2,
  new_count: 2,
  learning_count: 1,
  due_count: 1,
}

export const flashcardSetAi: FlashcardSetItem = {
  id: "0000000c-0000-4000-8000-000000000002",
  title: "English: irregular verbs",
  description: null,
  source: "ai",
  card_count: 20,
  due_today: 0,
  new_today: 10,
  new_count: 10,
  learning_count: 0,
  due_count: 0,
}

export const flashcardSets: FlashcardSetItem[] = [flashcardSetPhysics, flashcardSetAi]

export const flashcardSetDetail: FlashcardSetDetail = {
  ...flashcardSetPhysics,
  new_per_day: 10,
  reviews_per_day: 100,
  cards: flashcardCards,
}

const intervals = { again: "10m", hard: "1d", medium: "3d", easy: "7d" }

export const studyNext: StudyNext = {
  set_id: ids.flashcardSet,
  card: {
    id: flashcardCards[0]?.id ?? "",
    front: "What is velocity?",
    back: "The rate of change of position.",
    state: "review",
  },
  intervals,
  counts: { learning: 1, review: 1, new: 2 },
  done_for_today: false,
}

/** The card after `studyNext` once it has been reviewed. */
export const studyNextSecond: StudyNext = {
  ...studyNext,
  card: {
    id: flashcardCards[1]?.id ?? "",
    front: "What is acceleration?",
    back: "The rate of change of velocity.",
    state: "learning",
  },
  counts: { learning: 1, review: 0, new: 2 },
}

export const studyDone: StudyNext = {
  set_id: ids.flashcardSet,
  card: null,
  intervals: null,
  counts: { learning: 0, review: 0, new: 0 },
  done_for_today: true,
}

/** Reviews per day in the weeks before "today" (2026-10-07), as the heatmap of the deck list shows them. */
export const flashcardStatsDays: FlashcardStats["days"] = [
  { date: "2026-09-21", count: 12 },
  { date: "2026-09-22", count: 25 },
  { date: "2026-09-23", count: 8 },
  { date: "2026-09-28", count: 30 },
  { date: "2026-09-29", count: 41 },
  { date: "2026-09-30", count: 18 },
  { date: "2026-10-01", count: 22 },
  { date: "2026-10-02", count: 5 },
  { date: "2026-10-05", count: 17 },
  { date: "2026-10-06", count: 26 },
  { date: "2026-10-07", count: 9 },
]

export const flashcardStats: FlashcardStats = {
  year: 2026,
  set_id: null,
  days: flashcardStatsDays,
  total_reviews: 213,
  days_studied: 11,
  daily_average: 19.4,
  days_learned_percent: 44,
  longest_streak: 5,
  current_streak: 3,
  first_review_date: "2026-09-21",
  today_count: 9,
  today_seconds: 74,
}

/** Stats of a year without reviews. */
export const flashcardStatsEmpty: FlashcardStats = {
  year: 2025,
  set_id: null,
  days: [],
  total_reviews: 0,
  days_studied: 0,
  daily_average: 0,
  days_learned_percent: 0,
  longest_streak: 5,
  current_streak: 3,
  first_review_date: "2026-09-21",
  today_count: 9,
  today_seconds: 74,
}
