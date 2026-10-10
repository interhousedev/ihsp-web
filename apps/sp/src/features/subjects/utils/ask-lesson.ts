/** The notebook chat reads this sessionStorage draft once when it opens (see `takeDraft` in features-core). */
export function notebookDraftKey(notebookId: string): string {
  return `ihsp.notebooks.draft.${notebookId}`
}

/** `/notebooks/view/?id=&lesson=`: the subject notebook chat with one lesson in focus. */
export function askLessonHref(notebookId: string, lessonId: string): string {
  const query = new URLSearchParams({ id: notebookId, lesson: lessonId })
  return `/notebooks/view/?${query.toString()}`
}

/** Leaves the question in the chat composer of the notebook; storage may be blocked, then the chat just opens. */
export function leaveLessonDraft(notebookId: string, text: string): void {
  try {
    window.sessionStorage.setItem(notebookDraftKey(notebookId), text)
  } catch {
    // The chat opens without the prefilled question.
  }
}
