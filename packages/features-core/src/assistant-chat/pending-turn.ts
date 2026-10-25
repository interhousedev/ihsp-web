/**
 * The first message of a new chat, handed from the home composer to the chat page (spec § 5.2). `web` is set only
 * when the web switch was on, so the first message keeps it.
 */
export type PendingTurn = { text: string; file_ids: string[]; web?: boolean }

const KEY_PREFIX = "ihsp.assistant.pending."

/** Fallback when `sessionStorage` is blocked (private mode, some WebViews); lives until the page is reloaded. */
const memory = new Map<string, PendingTurn>()

export function pendingTurnKey(chatId: string): string {
  return `${KEY_PREFIX}${chatId}`
}

function isPendingTurn(value: unknown): value is PendingTurn {
  if (typeof value !== "object" || value === null) return false
  const candidate = value as { text?: unknown; file_ids?: unknown; web?: unknown }
  return (
    typeof candidate.text === "string" &&
    Array.isArray(candidate.file_ids) &&
    candidate.file_ids.every((id) => typeof id === "string") &&
    (candidate.web === undefined || typeof candidate.web === "boolean")
  )
}

/** Remembers the text (and attached file ids) that the chat page must send once it opens. */
export function storePendingTurn(chatId: string, turn: PendingTurn): void {
  try {
    window.sessionStorage.setItem(pendingTurnKey(chatId), JSON.stringify(turn))
    memory.delete(chatId)
  } catch {
    memory.set(chatId, turn)
  }
}

/** Reads and removes the pending first message of a chat; `null` when there is none. */
export function takePendingTurn(chatId: string): PendingTurn | null {
  const fromMemory = memory.get(chatId) ?? null
  memory.delete(chatId)
  try {
    const raw = window.sessionStorage.getItem(pendingTurnKey(chatId))
    if (raw === null) return fromMemory
    window.sessionStorage.removeItem(pendingTurnKey(chatId))
    const parsed: unknown = JSON.parse(raw)
    return isPendingTurn(parsed) ? parsed : fromMemory
  } catch {
    return fromMemory
  }
}
