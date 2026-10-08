import type {
  AttemptResult,
  AttemptReview,
  AttemptView,
  CourseCard,
  CoursePage,
  CourseStaffItem,
  CourseStudent,
  LmsCardStudy,
  MyCourses,
  LearnerOutlineSection,
  StepProgressItem,
  StepView,
} from "@ihsp/api"
import { ids, persons } from "./world"

export const courseCard: CourseCard = {
  id: ids.course,
  slug: "derivatives-101",
  title: "Derivatives 101",
  description: "A short course on limits and derivatives with a quiz and flash cards.",
  cover_url: null,
  steps_count: 3,
  progress_pct: 33,
  visibility: "public",
  updated_at: "2026-10-01T09:00:00Z",
}

export const courseCardInvite: CourseCard = {
  ...courseCard,
  id: "0000000e-0000-4000-8000-0000000000e2",
  slug: "linear-algebra-intro",
  title: "Linear algebra intro",
  description: "Vectors and matrices.",
  steps_count: 8,
  progress_pct: null,
  visibility: "invite",
}

export const courseCards: CourseCard[] = [courseCard, { ...courseCardInvite, visibility: "public" }]

export const myCourses: MyCourses = {
  enrolled: [courseCard],
  managed: [{ ...courseCard, progress_pct: null }, courseCardInvite],
}

export const courseStaff: CourseStaffItem[] = [
  {
    user: persons.rakhimov,
    role: "Author",
    permissions: ["edit", "publish", "review", "manage_staff", "view_drafts"],
    show_on_page: true,
    position: 1,
  },
  {
    user: persons.admin,
    role: "Tester",
    permissions: ["view_drafts"],
    show_on_page: false,
    position: 2,
  },
]

export const courseOutline: LearnerOutlineSection[] = [
  {
    id: ids.courseSectionIntro,
    title: "Introduction",
    steps: [{ step_id: ids.courseStepText, title: "What is a derivative?", completed: true, badge: null }],
  },
  {
    id: ids.courseSectionRules,
    title: "Rules and practice",
    steps: [
      { step_id: ids.courseStepTest, title: "Derivative rules quiz", completed: false, badge: "changed" },
      { step_id: ids.courseStepCards, title: "Key formulas", completed: false, badge: "new" },
    ],
  },
]

export const coursePage: CoursePage = {
  ...courseCard,
  staff: courseStaff.filter((item) => item.show_on_page),
  outline: courseOutline,
  enrolled: true,
  can_edit: false,
  changed_since_last_visit: [ids.courseStepTest, ids.courseStepCards],
}

export const coursePageNotEnrolled: CoursePage = {
  ...coursePage,
  progress_pct: null,
  enrolled: false,
  changed_since_last_visit: [],
}

export const attemptResultPassed: AttemptResult = {
  id: ids.attempt,
  score: 2,
  max_score: 3,
  passed: true,
  submitted_at: "2026-10-06T12:00:00Z",
  review: [
    { question_id: "q1", correct: true },
    { question_id: "q2", correct: true },
    { question_id: "q3", correct: false, correct_answer: { number: 12 }, explanation: "d/dx x^3 at x=2 is 3x^2 = 12." },
  ],
}

export const stepViewText: StepView = {
  step_id: ids.courseStepText,
  revision_id: "0000000f-0000-4000-8000-000000000001",
  title: "What is a derivative?",
  blocks: [
    {
      id: "b1",
      type: "text",
      markdown:
        "# What is a derivative?\n\nThe derivative measures how fast a function changes.\n\n$f'(x)=\\lim_{h\\to 0}\\frac{f(x+h)-f(x)}{h}$",
    },
  ],
  completed: true,
  preview: false,
}

/** A step with a test: rules only, no correctness anywhere (backend never sends it before submit). */
export const stepViewTest: StepView = {
  step_id: ids.courseStepTest,
  revision_id: "0000000f-0000-4000-8000-000000000002",
  title: "Derivative rules quiz",
  blocks: [
    {
      id: "b2",
      type: "test",
      rules: { questions: 3, attempts_left: 2, time_limit_sec: 600, passing_score_pct: 60 },
      best: attemptResultPassed,
      open_attempt_id: null,
    },
  ],
  completed: false,
  preview: false,
}

export const stepViewCards: StepView = {
  step_id: ids.courseStepCards,
  revision_id: "0000000f-0000-4000-8000-000000000003",
  title: "Key formulas",
  blocks: [{ id: "b3", type: "flashcards", cards_count: 4, due: 4 }],
  completed: false,
  preview: false,
}

export const stepViews: StepView[] = [stepViewText, stepViewTest, stepViewCards]

export const stepProgress: StepProgressItem = {
  step_id: ids.courseStepText,
  viewed_at: "2026-10-07T05:12:00Z",
  completed: true,
}

/** An open attempt: three questions, no correct flags. */
export const attemptView: AttemptView = {
  id: ids.attempt,
  block_id: "b2",
  attempt_no: 1,
  started_at: "2026-10-07T05:10:00Z",
  deadline_at: "2026-10-07T05:20:00Z",
  questions: [
    {
      id: "q1",
      type: "single",
      prompt: "What is the derivative of x^2?",
      points: 1,
      options: [
        { id: "o1", text: "x" },
        { id: "o2", text: "2x" },
        { id: "o3", text: "x^2" },
      ],
    },
    {
      id: "q2",
      type: "multiple",
      prompt: "Which functions have derivative 0 everywhere?",
      points: 1,
      options: [
        { id: "o4", text: "f(x) = 5" },
        { id: "o5", text: "f(x) = x" },
        { id: "o6", text: "f(x) = 0" },
      ],
    },
    { id: "q3", type: "number", prompt: "Compute the derivative of x^3 at x = 2.", points: 1 },
  ],
  answers: {},
  submitted_at: null,
}

export const lmsCardStudy: LmsCardStudy = {
  block_id: "b3",
  card: { id: "0000000e-0000-4000-8000-0000000000c1", front: "d/dx sin x", back: "cos x" },
  intervals: { again: "10m", hard: "1d", medium: "3d", easy: "7d" },
  counts: { learning: 0, review: 0, new: 4 },
}

export const courseStudents: CourseStudent[] = [
  {
    user: persons.student,
    progress_pct: 33,
    completed_at: null,
    attempts: [
      {
        id: ids.attempt,
        step_id: ids.courseStepTest,
        block_id: "b2",
        score: 2,
        max_score: 3,
        passed: true,
        submitted_at: "2026-10-06T12:00:00Z",
      },
    ],
  },
]

export const attemptReview: AttemptReview = {
  ...attemptResultPassed,
  user: persons.student,
  variant: { question_ids: ["q1", "q2", "q3"] },
  answers: { q1: { option_ids: ["o2"] }, q2: { option_ids: ["o4", "o6"] }, q3: { number: 8 } },
  revision_id: "0000000f-0000-4000-8000-000000000002",
  override_score: null,
  override_comment: null,
}
