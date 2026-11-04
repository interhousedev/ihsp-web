/** Longest project name the server keeps (`ProjectBody.name`). */
export const MAX_PROJECT_NAME_LENGTH = 120

/** The name as the server stores it: trimmed and cut to the limit; `null` when nothing is left to save. */
export function normalizeProjectName(input: string): string | null {
  const trimmed = input.trim()
  if (trimmed === "") return null
  return trimmed.slice(0, MAX_PROJECT_NAME_LENGTH)
}

/** The Projects list of the assistant (`<basePath>/projects/`). */
export function projectsHref(basePath: string): string {
  return `${basePath}/projects/`
}

/** One project page: the id is a query parameter, the page is static (`<basePath>/project/?id=`). */
export function projectHref(basePath: string, projectId: string): string {
  return `${basePath}/project/?id=${encodeURIComponent(projectId)}`
}

/** A chat of the assistant, opened from a project (`<basePath>/chat/?id=`). */
export function projectChatHref(basePath: string, chatId: string): string {
  return `${basePath}/chat/?id=${encodeURIComponent(chatId)}`
}
