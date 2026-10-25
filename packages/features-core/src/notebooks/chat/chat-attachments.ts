import type { ChatAttachment } from "@ihsp/api"

/**
 * A chip above the composer: a lesson or a lesson material (sent as `attachments`) or a file uploaded as a source of
 * the notebook (sent as `source_ids`). `pending` is a file still uploading; sending waits for it.
 */
export type AttachedItem =
  | { kind: "lesson" | "material"; key: string; label: string; attachment: ChatAttachment }
  | { kind: "file"; key: string; label: string; sourceId?: string; pending?: boolean }

/** Other pages ("Ask AI about this lesson") leave chips for the chat in sessionStorage under this key. */
export function attachmentsKey(notebookId: string): string {
  return `ihsp.notebooks.attach.${notebookId}`
}

function isAttachedItem(value: unknown): value is AttachedItem {
  if (typeof value !== "object" || value === null) return false
  const item = value as Record<string, unknown>
  return typeof item.key === "string" && typeof item.label === "string" && typeof item.kind === "string"
}

function readStored(notebookId: string): AttachedItem[] {
  const raw = window.sessionStorage.getItem(attachmentsKey(notebookId))
  if (!raw) return []
  const parsed: unknown = JSON.parse(raw)
  return Array.isArray(parsed) ? parsed.filter(isAttachedItem) : []
}

/** Leaves a chip for the chat of the notebook; blocked storage just opens the chat without it. */
export function leaveChatAttachment(notebookId: string, item: AttachedItem): void {
  try {
    const items = readStored(notebookId).filter((stored) => stored.key !== item.key)
    window.sessionStorage.setItem(attachmentsKey(notebookId), JSON.stringify([...items, item]))
  } catch {
    // The chat opens without the chip.
  }
}

/** Reads and removes the chips left for the notebook; empty when there are none or storage is blocked. */
export function takeChatAttachments(notebookId: string): AttachedItem[] {
  try {
    const items = readStored(notebookId)
    window.sessionStorage.removeItem(attachmentsKey(notebookId))
    return items
  } catch {
    return []
  }
}

/** What the chips add to a question: `attachments` and the `source_ids` of uploaded files. */
export function toSendOptions(items: readonly AttachedItem[]): {
  attachments?: ChatAttachment[]
  sourceIds?: string[]
} {
  const attachments: ChatAttachment[] = []
  const sourceIds: string[] = []
  for (const item of items) {
    if (item.kind === "file") {
      if (item.sourceId) sourceIds.push(item.sourceId)
    } else attachments.push(item.attachment)
  }
  return {
    ...(attachments.length > 0 ? { attachments } : {}),
    ...(sourceIds.length > 0 ? { sourceIds } : {}),
  }
}
