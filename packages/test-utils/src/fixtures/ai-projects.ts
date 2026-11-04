import type { ChatItem, ProjectFileResponse, ProjectResponse } from "@ihsp/api"
import { uuid } from "./world"

/** Projects of the student assistant: ids are stable so tests can link to them. */
export const projectIds = {
  physics: uuid(20, 1),
  essay: uuid(20, 2),
} as const

export const projectItems: ProjectResponse[] = [
  {
    id: projectIds.physics,
    name: "Physics lab",
    instructions: "",
    created_at: "2026-10-01T08:00:00Z",
    updated_at: "2026-10-03T09:30:00Z",
  },
  {
    id: projectIds.essay,
    name: "Essay on Pushkin",
    instructions: "Answer in Russian.",
    created_at: "2026-10-02T08:00:00Z",
    updated_at: "2026-10-02T08:00:00Z",
  },
]

export const projectFileItems: Record<string, ProjectFileResponse[]> = {
  [projectIds.physics]: [{ file_id: uuid(21, 1), name: "lab-notes.pdf", status: "ready" }],
  [projectIds.essay]: [],
}

/** Chats that already sit in a project (they show in its Chats tab and under the project in the sidebar). */
export const projectChatItems: (ChatItem & { project_id: string })[] = [
  {
    id: uuid(22, 1),
    assistant: "student",
    title: "Ohm's law",
    last_message_at: "2026-10-03T09:30:00Z",
    pending_approvals: 0,
    course_id: null,
    tier: "fast",
    project_id: projectIds.physics,
  },
]
