import type {
  CourseMastery,
  EngagementSettings,
  EngagementSummary,
  Quest,
  QuestBody,
  QuestList,
  ReviewAnswerResult,
  ReviewGradeResult,
  ReviewList,
  XpHistory,
} from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { apiUrl, nextId, noContent, notFound, param, readJson } from "./utils"

const COURSE = "0190a000-0000-4000-8000-0000000000c1"
const STEP = "0190a000-0000-4000-8000-0000000000c2"

export const engagementSummaryFixture: EngagementSummary = {
  level: 2,
  xp_total: 130,
  xp_into_level: 30,
  xp_for_next: 100,
  weekly_goal_days: 5,
  review_due: 1,
  streak: {
    current: 2,
    best: 4,
    freezes: 1,
    today_done: false,
    week: [
      { date: "2026-01-12", state: "done" },
      { date: "2026-01-13", state: "done" },
      { date: "2026-01-14", state: "pending" },
      { date: "2026-01-15", state: "pending" },
      { date: "2026-01-16", state: "pending" },
    ],
  },
}

export const xpHistoryFixture: XpHistory = {
  items: [{ at: "2026-01-13T10:00:00Z", source: "step", ref: STEP, xp: 20 }],
}

export const reviewListFixture: ReviewList = {
  items: [
    {
      item_id: "0190a000-0000-4000-8000-0000000000d1",
      kind: "flashcard",
      course_id: COURSE,
      step_id: STEP,
      question: null,
      card: { front: "2 + 2", back: "4" },
    },
  ],
}

const questFixture: Quest = {
  id: "0190a000-0000-4000-8000-0000000000d2",
  course_id: COURSE,
  course_title: "Algebra I",
  title: "Ten steps together",
  goal_kind: "steps",
  target: 10,
  class_target: 100,
  starts_on: "2026-01-12",
  ends_on: "2026-01-23",
  my_progress: 4,
  class_progress: 37,
  done: false,
}

let settings: EngagementSettings = { unlock_threshold_pct: null }
let quests: Quest[] = [structuredClone(questFixture)]

export function resetEngagementState(): void {
  settings = { unlock_threshold_pct: null }
  quests = [structuredClone(questFixture)]
}

function questOf(id: string, courseId: string, body: Partial<QuestBody>, old?: Quest): Quest {
  return {
    ...questFixture,
    my_progress: 0,
    class_progress: 0,
    ...old,
    ...body,
    id,
    course_id: courseId,
  }
}

export const lmsEngagementHandlers = [
  http.get(apiUrl("/v1/lms/engagement/summary"), () => HttpResponse.json(engagementSummaryFixture)),
  http.get(apiUrl("/v1/lms/engagement/xp"), () => HttpResponse.json(xpHistoryFixture)),
  http.get(apiUrl("/v1/lms/engagement/review"), () => HttpResponse.json(reviewListFixture)),
  http.post(apiUrl("/v1/lms/engagement/review/:itemId/answer"), () => {
    const result: ReviewAnswerResult = {
      correct: true,
      correct_answer: null,
      explanation: null,
      next_due: "2026-01-16T09:00:00Z",
      xp: 5,
    }
    return HttpResponse.json(result)
  }),
  http.post(apiUrl("/v1/lms/engagement/review/:itemId/grade"), () => {
    const result: ReviewGradeResult = { next_due: "2026-01-16T09:00:00Z", xp: 5 }
    return HttpResponse.json(result)
  }),
  http.get(apiUrl("/v1/lms/engagement/courses/:courseId/mastery"), () => {
    const mastery: CourseMastery = {
      unlock_threshold_pct: settings.unlock_threshold_pct,
      sections: [
        {
          section_id: "0190a000-0000-4000-8000-0000000000c3",
          title: "Numbers",
          mastery_pct: 80,
          unlocked: true,
          steps: [{ step_id: STEP, title: "Integers", completed: true, best_pct: 80 }],
        },
      ],
    }
    return HttpResponse.json(mastery)
  }),
  http.get(apiUrl("/v1/lms/engagement/quests"), () => HttpResponse.json({ items: quests } satisfies QuestList)),
  http.get(apiUrl("/v1/lms/courses/:courseId/engagement-settings"), () => HttpResponse.json(settings)),
  http.put(apiUrl("/v1/lms/courses/:courseId/engagement-settings"), async ({ request }) => {
    const body = await readJson<EngagementSettings>(request)
    settings = { unlock_threshold_pct: body.unlock_threshold_pct ?? null }
    return HttpResponse.json(settings)
  }),
  http.get(apiUrl("/v1/lms/courses/:courseId/quests"), () => HttpResponse.json({ items: quests } satisfies QuestList)),
  http.post(apiUrl("/v1/lms/courses/:courseId/quests"), async ({ request, params }) => {
    const quest = questOf(nextId(0xd3), param(params, "courseId"), await readJson<QuestBody>(request))
    quests = [...quests, quest]
    return HttpResponse.json(quest)
  }),
  http.patch(apiUrl("/v1/lms/courses/:courseId/quests/:questId"), async ({ request, params }) => {
    const id = param(params, "questId")
    const old = quests.find((q) => q.id === id)
    if (!old) return notFound("Quest")
    const quest = questOf(id, old.course_id, await readJson<QuestBody>(request), old)
    quests = quests.map((q) => (q.id === id ? quest : q))
    return HttpResponse.json(quest)
  }),
  http.delete(apiUrl("/v1/lms/courses/:courseId/quests/:questId"), ({ params }) => {
    quests = quests.filter((q) => q.id !== param(params, "questId"))
    return noContent()
  }),
]
