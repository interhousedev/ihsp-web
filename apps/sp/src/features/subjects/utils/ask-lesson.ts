import { leaveChatAttachment } from "@ihsp/features-core"

/** `/notebooks/view/?id=&lesson=`: the subject notebook chat with one lesson in focus. */
export function askLessonHref(notebookId: string, lessonId: string): string {
  const query = new URLSearchParams({ id: notebookId, lesson: lessonId })
  return `/notebooks/view/?${query.toString()}`
}

/** Leaves the lesson as a chip above the chat composer of the notebook (read once by the composer in features-core). */
export function leaveLessonAttachment(notebookId: string, lessonId: string, label: string): void {
  leaveChatAttachment(notebookId, {
    kind: "lesson",
    key: `lesson:${lessonId}`,
    label,
    attachment: { kind: "lesson", id: lessonId },
  })
}
