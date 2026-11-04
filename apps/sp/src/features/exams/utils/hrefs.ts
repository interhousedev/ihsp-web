/** Routes of the exams pages (static export: the control is in the query string). */
export const EXAMS_HREF = "/exams/"

export const examHref = (id: string) => `/exams/view/?id=${encodeURIComponent(id)}`

export const lessonHref = (id: string) => `/lessons/view/?id=${encodeURIComponent(id)}`

/** The new-deck editor with the title filled in (`/flashcards/edit/?title=`). */
export function newDeckHref(title: string): string {
  return `/flashcards/edit/?${new URLSearchParams({ title }).toString()}`
}

/** Where "Practice quiz" goes by default: the notebooks page. The exam page takes it as `practiceQuizHref`. */
export const PRACTICE_QUIZ_HREF = "/notebooks/"
