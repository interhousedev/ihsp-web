import type {
  CourseDraft,
  PendingChanges,
  RevisionItem,
  StepContent,
  StepDiff,
  StepDraft,
  TestConfig,
  VersionCompare,
  VersionItem,
  VersionView,
} from "@ihsp/api"
import { courseOutline } from "./lms-learning"
import { ids, persons } from "./world"

export const testConfig: TestConfig = {
  max_attempts: 3,
  passing_score_pct: 60,
  shuffle_questions: true,
  shuffle_options: true,
  pool_size: null,
  time_limit_sec: 600,
  cooldown_sec: null,
  show_answers: "after_submit",
}

/** The test step with correct answers (authors only). */
export const stepContentTest: StepContent = {
  title: "Derivative rules quiz",
  blocks: [
    {
      id: "b2",
      type: "test",
      config: testConfig,
      questions: [
        {
          id: "q1",
          type: "single",
          prompt: "What is the derivative of x^2?",
          points: 1,
          explanation: "Power rule: d/dx x^n = n x^(n-1).",
          options: [
            { id: "o1", text: "x", correct: false, pinned: false },
            { id: "o2", text: "2x", correct: true, pinned: false },
            { id: "o3", text: "x^2", correct: false, pinned: false },
          ],
        },
        {
          id: "q2",
          type: "multiple",
          prompt: "Which functions have derivative 0 everywhere?",
          points: 1,
          explanation: null,
          options: [
            { id: "o4", text: "f(x) = 5", correct: true, pinned: false },
            { id: "o5", text: "f(x) = x", correct: false, pinned: false },
            { id: "o6", text: "f(x) = 0", correct: true, pinned: true },
          ],
        },
        {
          id: "q3",
          type: "number",
          prompt: "Compute the derivative of x^3 at x = 2.",
          points: 1,
          explanation: "3x^2 at x = 2 is 12.",
          answer: { value: 12, tolerance: 0 },
        },
      ],
    },
  ],
}

export const stepContentText: StepContent = {
  title: "What is a derivative?",
  blocks: [
    {
      id: "b1",
      type: "text",
      markdown: "# What is a derivative?\n\nThe derivative measures how fast a function changes.",
    },
  ],
}

export const stepDraftTest: StepDraft = {
  step_id: ids.courseStepTest,
  course_id: ids.course,
  content: stepContentTest,
  lock_version: 4,
  status: "changed",
  updated_via: "ui",
  updated_by: persons.rakhimov,
  updated_at: "2026-10-06T15:00:00Z",
}

export const stepDraftText: StepDraft = {
  ...stepDraftTest,
  step_id: ids.courseStepText,
  content: stepContentText,
  lock_version: 2,
  status: "unchanged",
  updated_via: "mcp",
}

export const stepDrafts: StepDraft[] = [stepDraftText, stepDraftTest]

export const courseDraft: CourseDraft = {
  id: ids.course,
  slug: "derivatives-101",
  title: "Derivatives 101",
  description: "A short course on limits and derivatives with a quiz and flash cards.",
  visibility: "public",
  status: "active",
  invite_code: "KP7M2Q",
  lock_version: 7,
  draft_seq: 12,
  outline: courseOutline,
  pending_count: 2,
  live_version: 2,
  my_permissions: ["edit", "publish", "review", "manage_staff", "view_drafts"],
}

export const revisionItems: RevisionItem[] = [
  {
    id: "0000000f-0000-4000-8000-0000000000a1",
    kind: "publish",
    label: null,
    created_by: persons.rakhimov,
    created_at: "2026-10-01T09:00:00Z",
    published: true,
  },
  {
    id: "0000000f-0000-4000-8000-0000000000a2",
    kind: "checkpoint",
    label: "Before adding question 3",
    created_by: persons.rakhimov,
    created_at: "2026-10-05T11:00:00Z",
    published: false,
  },
]

export const stepDiff: StepDiff = {
  live: {
    title: stepContentTest.title,
    blocks: [{ id: "b2", type: "test", config: testConfig, questions: [] }],
  },
  draft: stepContentTest,
}

export const pendingChanges: PendingChanges = {
  draft_seq: 12,
  outline_changed: true,
  steps: [
    { step_id: ids.courseStepTest, title: "Derivative rules quiz", change: "changed", via_mcp: false, via_ai: false },
    { step_id: ids.courseStepCards, title: "Key formulas", change: "added", via_mcp: true, via_ai: false },
  ],
}

export const versionItem2: VersionItem = {
  number: 2,
  published_by: persons.rakhimov,
  published_at: "2026-10-01T09:00:00Z",
  note: "Added the quiz",
  changes: { added: 1, changed: 0, removed: 0, outline_changed: true },
}

export const versionItem1: VersionItem = {
  number: 1,
  published_by: persons.rakhimov,
  published_at: "2026-09-15T09:00:00Z",
  note: null,
  changes: { added: 1, changed: 0, removed: 0, outline_changed: true },
}

export const versionItems: VersionItem[] = [versionItem2, versionItem1]

export const versionView: VersionView = {
  ...versionItem2,
  meta: { title: "Derivatives 101", description: "A short course on limits and derivatives." },
  outline: courseOutline,
}

export const versionCompare: VersionCompare = {
  a: 1,
  b: 2,
  steps: [
    {
      step_id: ids.courseStepText,
      title: "What is a derivative?",
      change: "same",
      revision_a: "0000000f-0000-4000-8000-000000000001",
      revision_b: "0000000f-0000-4000-8000-000000000001",
    },
    {
      step_id: ids.courseStepTest,
      title: "Derivative rules quiz",
      change: "added",
      revision_a: null,
      revision_b: "0000000f-0000-4000-8000-000000000002",
    },
  ],
}
