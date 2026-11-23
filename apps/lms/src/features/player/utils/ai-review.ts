import type { AiReviewFileKind, AiReviewMessage, AiReviewTemplate } from "@ihsp/api"

/** Files one message or submission may carry (backend `MAX_FILES_PER_MESSAGE`). */
export const AI_REVIEW_MAX_FILES = 5

export const AI_REVIEW_FILE_KINDS: readonly AiReviewFileKind[] = ["pdf", "docx", "pptx", "image", "text"]

export const AI_REVIEW_TEMPLATES: readonly AiReviewTemplate[] = [
  "review_table",
  "rubric_checklist",
  "strengths_cards",
  "image_gallery",
]

/** Content types the backend accepts per kind (backend `CONTENT_TYPES`) and their usual extensions. */
const KINDS: Record<AiReviewFileKind, { types: readonly string[]; extensions: readonly string[] }> = {
  pdf: { types: ["application/pdf"], extensions: [".pdf"] },
  docx: { types: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"], extensions: [".docx"] },
  pptx: {
    types: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
    extensions: [".pptx"],
  },
  image: {
    types: ["image/png", "image/jpeg", "image/webp", "image/gif"],
    extensions: [".png", ".jpg", ".jpeg", ".webp", ".gif"],
  },
  text: { types: ["text/plain", "text/markdown", "text/csv"], extensions: [".txt", ".md", ".csv"] },
}

/** The `accept` attribute of a file input for the kinds. */
export function acceptAttribute(kinds: readonly AiReviewFileKind[]): string {
  return kinds.flatMap((kind) => [...KINDS[kind].types, ...KINDS[kind].extensions]).join(",")
}

/** The kind of a file by its content type, then by its extension; `null` when the backend would reject it. */
export function fileKind(file: { name: string; type: string }): AiReviewFileKind | null {
  const name = file.name.toLowerCase()
  for (const kind of AI_REVIEW_FILE_KINDS) {
    if (KINDS[kind].types.includes(file.type)) return kind
  }
  for (const kind of AI_REVIEW_FILE_KINDS) {
    if (KINDS[kind].extensions.some((extension) => name.endsWith(extension))) return kind
  }
  return null
}

/** The content type to upload with: the browser's one, or the kind's one when the browser gave none it knows. */
export function uploadContentType(file: { name: string; type: string }): string | null {
  const kind = fileKind(file)
  if (kind === null) return null
  const types = KINDS[kind].types
  if (types.includes(file.type)) return file.type
  const name = file.name.toLowerCase()
  if (kind === "image")
    return name.endsWith(".png")
      ? "image/png"
      : name.endsWith(".webp")
        ? "image/webp"
        : name.endsWith(".gif")
          ? "image/gif"
          : "image/jpeg"
  if (kind === "text") return name.endsWith(".md") ? "text/markdown" : name.endsWith(".csv") ? "text/csv" : "text/plain"
  return types[0] ?? null
}

/** Whether the file may be sent to a block accepting `kinds`. */
export function isAccepted(file: { name: string; type: string }, kinds: readonly AiReviewFileKind[]): boolean {
  const kind = fileKind(file)
  return kind !== null && kinds.includes(kind)
}

/** The newest final review of a conversation, if any. */
export function latestReview(messages: readonly AiReviewMessage[]): AiReviewMessage | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message?.kind === "review" && message.role === "assistant") return message
  }
  return null
}

/** Markdown with the OpenUI block appended: the input of `MessageWithOpenUi`. */
export function messageSource(message: Pick<AiReviewMessage, "text" | "openui">): string {
  return [message.text, message.openui].filter((part): part is string => Boolean(part && part.trim())).join("\n\n")
}
