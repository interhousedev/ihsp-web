/** The assistant sidebar ("Ask a notebook") leaves the text in sessionStorage under this key before opening the chat. */
export function draftKey(notebookId: string): string {
  return `ihsp.notebooks.draft.${notebookId}`
}

/** Reads and removes the draft text for a notebook; `null` when there is none or storage is blocked. */
export function takeDraft(notebookId: string): string | null {
  try {
    const key = draftKey(notebookId)
    const value = window.sessionStorage.getItem(key)
    window.sessionStorage.removeItem(key)
    return value && value.trim() !== "" ? value : null
  } catch {
    return null
  }
}

/** True on phones and tablets, where Enter inserts a newline and the send button sends. */
export function isTouchDevice(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches
}
