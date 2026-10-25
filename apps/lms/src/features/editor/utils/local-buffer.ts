/**
 * The offline buffer (UF-LMS-08, 3b): unsaved edits are mirrored to `localStorage` and survive a lost connection, a
 * closed tab or a crash. Every access is guarded, because storage can be blocked or full.
 */

const PREFIX = "lms:buffer:"

export type Buffered<T> = { value: T; saved_at: string }

export const bufferKey = {
  course: (courseId: string) => `${PREFIX}course:${courseId}`,
  step: (stepId: string) => `${PREFIX}step:${stepId}`,
}

export function readBuffer<T>(key: string): Buffered<T> | null {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed === "object" && parsed !== null && "value" in parsed && "saved_at" in parsed)
      return parsed as Buffered<T>
    return null
  } catch {
    return null
  }
}

export function writeBuffer<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(
      key,
      JSON.stringify({ value, saved_at: new Date().toISOString() } satisfies Buffered<T>),
    )
  } catch {
    // storage is full or blocked: editing still works, only the offline copy is lost
  }
}

export function clearBuffer(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // nothing to clear
  }
}
