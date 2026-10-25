// Course workspaces: the notebook of an LMS course with a draft outline, a ready course plan and lesson draft, the
// Apply previews and an author-assistant chat that waits for the approval of `apply_outline`.

import type {
  ApplyPreview,
  TurnResult,
  ApplyResult,
  ArtifactDetail,
  ArtifactItem,
  ChatDetail,
  ChatItem,
  ChatMessageView,
  CourseOutline,
  CoursePlanContent,
  CourseWorkspace,
  LessonDraftContent,
  NotebookDetail,
} from "@ihsp/api"
import { uuid } from "./world"

export const courseIds = {
  course: uuid(60, 1),
  workspace: uuid(60, 2),
  sectionIntro: "intro001",
  sectionMotion: "motion01",
  stepWelcome: uuid(61, 1),
  stepKinematics: uuid(61, 2),
  stepNewLaws: uuid(61, 3),
  coursePlan: uuid(62, 1),
  lessonDraft: uuid(62, 2),
  authorChat: uuid(63, 1),
} as const

export const courseWorkspaceDetail: NotebookDetail = {
  id: courseIds.workspace,
  title: "Mechanics for Grade 10",
  emoji: "🎓",
  pinned: false,
  source_count: 2,
  last_opened_at: "2026-10-07T04:30:00Z",
  updated_at: "2026-10-07T04:30:00Z",
  course_id: courseIds.course,
  can_write: true,
  origin: "course",
  subject_id: null,
  lesson_id: null,
  group_id: null,
  auto: null,
  chat_config: { style: "default", custom_prompt: null, length: "default", language: "auto" },
  summary: null,
  summary_status: "none",
  ready_source_count: 2,
  selected_source_count: 2,
  created_at: "2026-10-06T09:00:00Z",
}

/** A reader (`view_drafts`): the workspace is read-only for them. */
export const courseWorkspaceReadOnly: NotebookDetail = { ...courseWorkspaceDetail, can_write: false }

export const courseWorkspaceOpened: CourseWorkspace = {
  notebook_id: courseIds.workspace,
  course_id: courseIds.course,
  title: courseWorkspaceDetail.title,
  can_write: true,
  created: false,
}

export const workspaceOutline: CourseOutline = {
  course_id: courseIds.course,
  title: "Mechanics for Grade 10",
  sections: [
    {
      id: courseIds.sectionIntro,
      title: "Introduction",
      steps: [{ id: courseIds.stepWelcome, title: "Welcome", added: false }],
    },
    {
      id: courseIds.sectionMotion,
      title: "Motion",
      steps: [
        { id: courseIds.stepKinematics, title: "Kinematics", added: false },
        { id: courseIds.stepNewLaws, title: "Newton's laws", added: false },
      ],
    },
  ],
}

export const coursePlanContent: CoursePlanContent = {
  title: "Mechanics for Grade 10",
  summary: "A first course in mechanics: describing motion, then explaining it with forces and energy.",
  goals: ["Describe motion with graphs and equations", "Apply Newton's laws to everyday problems"],
  sections: [
    {
      title: "Motion",
      goals: ["Describe motion in one dimension"],
      steps: [
        { title: "Kinematics", goals: ["Read position-time graphs"], summary: "Velocity, acceleration and graphs." },
        { title: "Newton's laws", goals: ["State the three laws"], summary: "Forces, mass and acceleration." },
      ],
    },
    {
      title: "Energy",
      goals: ["Use conservation of energy"],
      steps: [
        { title: "Work and power", goals: ["Compute work of a constant force"], summary: "Work, power, units." },
        { title: "Conservation of energy", goals: ["Solve energy problems"], summary: "Kinetic and potential energy." },
      ],
    },
  ],
}

export const lessonDraftContent: LessonDraftContent = {
  title: "Newton's laws",
  step_id: courseIds.stepNewLaws,
  blocks: [
    {
      type: "text",
      markdown:
        "### Goal\n\nAfter this step you can state the three laws and use $F = ma$ to solve simple problems.\n\n### The second law\n\nThe net force on a body equals its mass times its acceleration.",
    },
    {
      type: "test",
      settings: { passing_score_pct: 60, show_answers: "after_submit" },
      questions: [
        {
          type: "single",
          prompt: "A 2 kg body accelerates at 3 m/s². What is the net force?",
          points: 1,
          explanation: "$F = ma = 2 \\cdot 3 = 6$ N.",
          options: [
            { text: "6 N", correct: true },
            { text: "1.5 N", correct: false },
            { text: "5 N", correct: false },
          ],
        },
      ],
    },
    {
      type: "flashcards",
      cards: [{ front: "State Newton's second law.", back: "$F = ma$: the net force equals mass times acceleration." }],
    },
  ],
}

function courseArtifact(id: string, kind: "course_plan" | "lesson_draft", title: string): ArtifactItem {
  return {
    id,
    notebook_id: courseIds.workspace,
    kind,
    format: null,
    title,
    status: "ready",
    error: null,
    options: {} as ArtifactItem["options"],
    prompt: null,
    source_count: 2,
    sampled: false,
    unread: true,
    progress: null,
    has_assets: false,
    parent_id: null,
    flashcard_set_id: null,
    created_at: "2026-10-07T04:10:00Z",
    finished_at: "2026-10-07T04:11:00Z",
  }
}

export const artifactCoursePlan = courseArtifact(courseIds.coursePlan, "course_plan", "Mechanics for Grade 10")
export const artifactLessonDraft = courseArtifact(courseIds.lessonDraft, "lesson_draft", "Newton's laws")

export function courseArtifactDetailOf(item: ArtifactItem): ArtifactDetail {
  const extra = { refs_index: {}, source_map: {}, progress_state: null, assets: [] }
  const ready = item.status === "ready"
  if (item.kind === "course_plan") {
    return { ...item, kind: "course_plan", content: ready ? coursePlanContent : null, ...extra }
  }
  if (item.kind === "lesson_draft") {
    return { ...item, kind: "lesson_draft", content: ready ? lessonDraftContent : null, ...extra }
  }
  throw new Error(`not a course output: ${item.kind}`)
}

export const applyPreviewPlan: ApplyPreview = {
  kind: "course_plan",
  can_apply: true,
  problems: [],
  notes: [],
  plan: {
    sections: [
      {
        title: "Motion",
        section_id: courseIds.sectionMotion,
        action: "exists",
        steps: [
          { title: "Kinematics", step_id: courseIds.stepKinematics, action: "exists" },
          { title: "Newton's laws", step_id: courseIds.stepNewLaws, action: "exists" },
        ],
      },
      {
        title: "Energy",
        section_id: null,
        action: "new",
        steps: [
          { title: "Work and power", step_id: null, action: "new" },
          { title: "Conservation of energy", step_id: null, action: "new" },
        ],
      },
    ],
    new_sections: 1,
    new_steps: 2,
    existing_steps: 2,
  },
  step: null,
}

export const applyPreviewStep: ApplyPreview = {
  kind: "lesson_draft",
  can_apply: true,
  problems: [],
  notes: [],
  plan: null,
  step: {
    step_id: courseIds.stepNewLaws,
    title: "Newton's laws",
    lock_version: 4,
    mode: "replace",
    current_blocks: [{ id: "blk00001", type: "text", markdown: "### Newton\n\nDraft text." }],
    new_blocks: [
      { id: "", type: "text", markdown: "### Goal\n\nAfter this step you can state the three laws." },
      { id: "", type: "flashcards", cards: [{ id: "", front: "State the second law.", back: "$F = ma$" }] },
    ],
  },
}

export const applyPreviewInvalid: ApplyPreview = {
  ...applyPreviewStep,
  can_apply: false,
  problems: ["question 1: a single choice question needs exactly one correct option"],
}

export const applyResultPlan: ApplyResult = {
  kind: "course_plan",
  created_sections: [{ id: "energy01", title: "Energy" }],
  created_steps: [
    { step_id: uuid(61, 10), section_id: "energy01", title: "Work and power" },
    { step_id: uuid(61, 11), section_id: "energy01", title: "Conservation of energy" },
  ],
  step_id: null,
  lock_version: null,
  draft_seq: 12,
}

export const applyResultStep: ApplyResult = {
  kind: "lesson_draft",
  created_sections: [],
  created_steps: [],
  step_id: courseIds.stepNewLaws,
  lock_version: 5,
  draft_seq: 13,
}

// - - - Author assistant chat - - -

export const authorChat: ChatItem = {
  id: courseIds.authorChat,
  assistant: "lms_author",
  title: "Plan the mechanics course",
  last_message_at: "2026-10-07T04:50:00Z",
  pending_approvals: 1,
  course_id: courseIds.course,
  tier: "fast",
}

export const authorMessageUser: ChatMessageView = {
  seq: 1,
  role: "user",
  text: "Plan a short mechanics course for grade 10 and add the energy section.",
  file_ids: [],
  tool_calls: [],
  created_at: "2026-10-07T04:48:00Z",
  web: [],
  feedback: null,
}

export const authorMessagePending: ChatMessageView = {
  seq: 2,
  role: "assistant",
  text: "I read the outline and the sources. I propose to add one section with two steps. Please approve the action below.",
  file_ids: [],
  tool_calls: [
    {
      id: "call_outline_1",
      tool: "get_course_outline",
      access: "read",
      status: "done",
      note: "Looked at the course outline",
      preview: null,
      reject_reason: null,
      expires_at: null,
    },
    {
      id: "call_outline_2",
      tool: "apply_outline",
      access: "write",
      status: "pending_approval",
      note: "",
      preview: {
        title: "Add to the course outline",
        fields: [{ label: "Course", value: "Mechanics for Grade 10", sensitive: false }],
        items: ["Energy", "  Work and power", "  Conservation of energy"],
      },
      reject_reason: null,
      expires_at: "2026-10-08T04:50:00Z",
    },
  ],
  created_at: "2026-10-07T04:50:00Z",
  web: [],
  feedback: null,
}

export const authorChatDetail: ChatDetail = {
  ...authorChat,
  messages: [authorMessageUser, authorMessagePending],
  shared: false,
}

export const authorChatEmpty: ChatDetail = {
  ...authorChat,
  title: "New chat",
  pending_approvals: 0,
  messages: [],
  shared: false,
}

/** Result of approving the pending `apply_outline` call of the author chat. */
export const authorTurnApproved: TurnResult = {
  chat: { ...authorChat, pending_approvals: 0 },
  new_messages: [
    {
      seq: 3,
      role: "assistant",
      text: "Done: the section **Energy** with two steps is in the draft.",
      file_ids: [],
      tool_calls: [
        {
          ...authorMessagePending.tool_calls[1]!,
          status: "done",
          expires_at: null,
        },
      ],
      created_at: "2026-10-07T05:13:00Z",
      web: [],
      feedback: null,
    },
  ],
  status: "done",
  usage: {
    session: { used: 12_000, limit: 1_500_000, resets_at: "2026-10-07T08:00:00Z" },
    day: { used: 30_000, limit: 4_000_000, resets_at: "2026-10-08T00:00:00Z" },
  },
}
