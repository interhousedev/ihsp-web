import type { ChatItem, ProjectBody, ProjectFileResponse, ProjectPatchBody, ProjectResponse } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { projectChatItems, projectFileItems, projectItems } from "../fixtures/ai-projects"
import { FIXTURE_NOW, uuid } from "../fixtures/world"
import { apiUrl, noContent, notFound, param, readJson } from "./utils"

// In-memory state of the student projects. `resetAiProjectsState` puts it back after every test (see `preload.ts`).
type StoredChat = ChatItem & { project_id: string }

let projects: ProjectResponse[] = structuredClone(projectItems)
let files: Record<string, ProjectFileResponse[]> = structuredClone(projectFileItems)
let chats: StoredChat[] = structuredClone(projectChatItems)

export function resetAiProjectsState(): void {
  projects = structuredClone(projectItems)
  files = structuredClone(projectFileItems)
  chats = structuredClone(projectChatItems)
}

/** Chats of one project, newest first (what `GET /v1/ai/chats?project_id=` answers). */
export function projectChatsFor(projectId: string): ChatItem[] {
  return chats.filter((chat) => chat.project_id === projectId)
}

/** Records a chat created inside a project (`POST /v1/ai/chats` with `project_id`). */
export function addProjectChat(chat: ChatItem, projectId: string): void {
  chats = [{ ...chat, project_id: projectId }, ...chats]
}

export const aiProjectsHandlers = [
  http.get(apiUrl("/v1/ai/projects"), () => HttpResponse.json(projects)),
  http.post(apiUrl("/v1/ai/projects"), async ({ request }) => {
    const body = await readJson<ProjectBody>(request)
    const project: ProjectResponse = {
      id: uuid(23, projects.length + 1),
      name: body.name ?? "",
      instructions: body.instructions ?? "",
      created_at: FIXTURE_NOW,
      updated_at: FIXTURE_NOW,
    }
    projects = [...projects, project]
    files[project.id] = []
    return HttpResponse.json(project)
  }),
  http.get(apiUrl("/v1/ai/projects/:project_id"), ({ params }) => {
    const project = projects.find((item) => item.id === param(params, "project_id"))
    return project ? HttpResponse.json(project) : notFound("Project")
  }),
  http.patch(apiUrl("/v1/ai/projects/:project_id"), async ({ params, request }) => {
    const id = param(params, "project_id")
    const project = projects.find((item) => item.id === id)
    if (!project) return notFound("Project")
    const body = await readJson<ProjectPatchBody>(request)
    const updated: ProjectResponse = {
      ...project,
      name: body.name ?? project.name,
      instructions: body.instructions ?? project.instructions,
      updated_at: FIXTURE_NOW,
    }
    projects = projects.map((item) => (item.id === id ? updated : item))
    return HttpResponse.json(updated)
  }),
  http.delete(apiUrl("/v1/ai/projects/:project_id"), ({ params }) => {
    const id = param(params, "project_id")
    projects = projects.filter((item) => item.id !== id)
    delete files[id]
    return noContent()
  }),
  http.get(apiUrl("/v1/ai/projects/:project_id/files"), ({ params }) =>
    HttpResponse.json(files[param(params, "project_id")] ?? []),
  ),
  http.post(apiUrl("/v1/ai/projects/:project_id/files"), async ({ params, request }) => {
    const id = param(params, "project_id")
    const body = await readJson<{ file_id: string }>(request)
    const fileId = body.file_id ?? ""
    files[id] = [...(files[id] ?? []), { file_id: fileId, name: `file ${fileId.slice(0, 8)}`, status: "ready" }]
    return noContent()
  }),
  http.delete(apiUrl("/v1/ai/projects/:project_id/files/:file_id"), ({ params }) => {
    const id = param(params, "project_id")
    const fileId = param(params, "file_id")
    files[id] = (files[id] ?? []).filter((file) => file.file_id !== fileId)
    return noContent()
  }),
]
