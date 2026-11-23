import type {
  Answer,
  AiReviewMessage,
  AiReviewMessages,
  AiReviewSession,
  AiReviewSubmission,
  BlockResult,
  ExamSession,
  HtmlWidgetLaunch,
  LearningHiddenTests,
  TutorConversation,
  VideoCaptions,
  VideoChecks,
} from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { apiUrl, param, readJson } from "./utils"

const NOW = "2026-01-14T09:00:00Z"
const LATER = "2026-01-14T09:30:00Z"

const moduleRef = {
  section_id: "0190a000-0000-4000-8000-0000000000f1",
  module_id: "0190a000-0000-4000-8000-0000000000f2",
  section_title: "Math",
  module_title: "Module 1",
  section_no: 1,
  module_no: 1,
  time_limit_sec: 1800,
  questions_count: 1,
}

const openModule = (blockId: string, answers: Record<string, Answer>): ExamSession => ({
  block_id: blockId,
  status: "in_module",
  server_now: NOW,
  modules_done: 0,
  current: {
    ...moduleRef,
    started_at: NOW,
    deadline_at: LATER,
    questions: [
      {
        id: "0190a000-0000-4000-8000-0000000000f3",
        type: "single",
        prompt: "2 + 2 = ?",
        points: 1,
        options: [
          { id: "a", text: "4" },
          { id: "b", text: "5" },
        ],
      },
    ],
    answers,
  },
  next: null,
  next_is_new_section: false,
  result: null,
})

const finishedExam = (blockId: string): ExamSession => ({
  block_id: blockId,
  status: "finished",
  server_now: LATER,
  modules_done: 1,
  current: null,
  next: null,
  next_is_new_section: false,
  result: {
    finished_at: LATER,
    score: 1,
    max_score: 1,
    scaled_total: null,
    scaled_min: null,
    scaled_max: null,
    sections: [{ section_id: moduleRef.section_id, title: "Math", score: 1, max_score: 1, scaled_score: null }],
    modules: [],
  },
})

let examAnswers: Record<string, Record<string, Answer>> = {}
let tutorMessages: TutorConversation["messages"] = []
let reviewMessages: AiReviewMessage[] = []

export function resetLmsWidgetsState(): void {
  examAnswers = {}
  tutorMessages = []
  reviewMessages = []
}

const launch = (kind: string, blockId: string): HtmlWidgetLaunch => ({
  base_url: `/v1/lms/html/${kind}-${blockId}/`,
  entry_url: `/v1/lms/html/${kind}-${blockId}/index.html`,
  expires_in: 14400,
})

const captions = (): VideoCaptions => ({
  expires_in: 3600,
  tracks: [{ lang: "en", label: "English", url: "https://storage.test/captions/en.vtt", default: true }],
})

const reviewSession = (id: string): AiReviewSession => ({
  id,
  step_id: "0190a000-0000-4000-8000-0000000000c2",
  block_id: "0190a000-0000-4000-8000-0000000000f4",
  status: "open",
  submissions_left: 3,
  messages: reviewMessages,
})

const answer = (text: string, kind: AiReviewMessage["kind"], role: AiReviewMessage["role"]): AiReviewMessage => ({
  id: `0190a000-0000-4000-8000-${(reviewMessages.length + 1).toString(16).padStart(12, "0")}`,
  role,
  text,
  openui: null,
  attachments: [],
  kind,
  created_at: NOW,
})

export const lmsWidgetsHandlers = [
  http.post(apiUrl("/v1/lms/steps/:stepId/blocks/:blockId/exam/start"), ({ params }) => {
    const blockId = param(params, "blockId")
    return HttpResponse.json(openModule(blockId, examAnswers[blockId] ?? {}))
  }),
  http.put(apiUrl("/v1/lms/steps/:stepId/blocks/:blockId/exam/answers"), async ({ request, params }) => {
    const blockId = param(params, "blockId")
    const { answers } = await readJson<{ answers: Record<string, Answer> }>(request)
    examAnswers[blockId] = { ...examAnswers[blockId], ...answers }
    return HttpResponse.json(openModule(blockId, examAnswers[blockId]))
  }),
  http.post(apiUrl("/v1/lms/steps/:stepId/blocks/:blockId/exam/submit"), ({ params }) =>
    HttpResponse.json(finishedExam(param(params, "blockId"))),
  ),
  http.get(apiUrl("/v1/lms/courses/:courseId/steps/:stepId/blocks/:blockId/captions"), () =>
    HttpResponse.json(captions()),
  ),
  http.get(apiUrl("/v1/lms/courses/:courseId/preview/steps/:stepId/blocks/:blockId/captions"), () =>
    HttpResponse.json(captions()),
  ),
  http.get(apiUrl("/v1/lms/courses/:courseId/steps/:stepId/blocks/:blockId/html-widget"), ({ params }) =>
    HttpResponse.json(launch("token", param(params, "blockId"))),
  ),
  http.get(apiUrl("/v1/lms/courses/:courseId/preview/steps/:stepId/blocks/:blockId/html-widget"), ({ params }) =>
    HttpResponse.json(launch("draft", param(params, "blockId"))),
  ),
  http.post(apiUrl("/v1/lms/courses/:courseId/steps/:stepId/blocks/:blockId/result"), async ({ request }) => {
    const { score_pct, passed } = await readJson<{ score_pct: number; passed: boolean }>(request)
    const result: BlockResult = { score: score_pct ?? 0, max_score: 100, completed: Boolean(passed) }
    return HttpResponse.json(result)
  }),
  http.post(apiUrl("/v1/lms/courses/:courseId/steps/:stepId/blocks/:blockId/hidden-tests"), () => {
    const body: LearningHiddenTests = {
      tests: [{ id: "h1", name: "hidden 1", hidden: true, code: "assert solve(2) == 4" }],
    }
    return HttpResponse.json(body)
  }),
  http.get(apiUrl("/v1/lms/steps/:stepId/tutor"), () => {
    const body: TutorConversation = { messages: tutorMessages, remaining_today: 20 }
    return HttpResponse.json(body)
  }),
  http.post(apiUrl("/v1/lms/steps/:stepId/tutor"), async ({ request }) => {
    const { message } = await readJson<{ message: string }>(request)
    tutorMessages = [
      ...tutorMessages,
      { role: "student", text: message ?? "", created_at: NOW },
      { role: "tutor", text: "What have you tried so far?", created_at: NOW },
    ]
    const body: TutorConversation = { messages: tutorMessages, remaining_today: 19 }
    return HttpResponse.json(body)
  }),
  http.post(apiUrl("/v1/lms/courses/:courseId/steps/:stepId/blocks/:blockId/video-checks/suggest"), () => {
    const body: VideoChecks = {
      checks: [
        {
          at_seconds: 30,
          question: "What happens next?",
          options: ["A", "B", "C"],
          correct_index: 0,
          explanation: "Because A.",
        },
      ],
      cards: [{ front: "Term", back: "Definition" }],
    }
    return HttpResponse.json(body)
  }),
  http.get(apiUrl("/v1/lms/ai-review/sessions/:sessionId"), ({ params }) =>
    HttpResponse.json(reviewSession(param(params, "sessionId"))),
  ),
  http.post(apiUrl("/v1/lms/ai-review/sessions/:sessionId/messages"), async ({ request }) => {
    const { text } = await readJson<{ text: string }>(request)
    const added = [answer(text ?? "", "chat", "student")]
    reviewMessages = [...reviewMessages, ...added]
    const reply = answer("Tell me more about your approach.", "question", "assistant")
    reviewMessages = [...reviewMessages, reply]
    const body: AiReviewMessages = { messages: [...added, reply] }
    return HttpResponse.json(body)
  }),
  http.post(apiUrl("/v1/lms/ai-review/sessions/:sessionId/submit"), () => {
    const review = answer("Looks solid overall.", "review", "assistant")
    reviewMessages = [...reviewMessages, review]
    const body: AiReviewMessages = { messages: [review] }
    return HttpResponse.json(body)
  }),
  http.get(apiUrl("/v1/lms/courses/:courseId/steps/:stepId/blocks/:blockId/ai-review/submissions"), () => {
    const item: AiReviewSubmission = {
      session_id: "0190a000-0000-4000-8000-0000000000f5",
      student: { id: "0190a000-0000-4000-8000-0000000000e4", name: "Aziza Karimova" },
      status: "reviewed",
      submitted_at: NOW,
      review_openui: null,
    }
    return HttpResponse.json({ items: [item] })
  }),
]
