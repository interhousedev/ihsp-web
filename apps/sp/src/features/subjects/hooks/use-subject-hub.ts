"use client"

import { getMeSubjectLessonsQuery, postNotebookAutoSubject } from "@ihsp/api"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { askLessonHref, leaveLessonDraft } from "../utils/ask-lesson"

export const PAST_STEP = 10

/** The subject hub list around now; `pastLimit` grows by `PAST_STEP` with every "show more". */
export function useSubjectLessons(subjectId: string | null, pastLimit: number) {
  return useQuery({
    ...getMeSubjectLessonsQuery(subjectId ?? "", { around: "now", past_limit: pastLimit }),
    enabled: subjectId !== null,
    placeholderData: (previous) => previous,
  })
}

/**
 * Opens (creating when needed) the notebook of the subject and goes to its chat. With a lesson, the question about
 * that lesson is prefilled and the lesson id travels in the address.
 */
export function useOpenSubjectNotebook(subjectId: string) {
  const router = useRouter()
  return useMutation({
    mutationFn: async (input: { lessonId?: string; question?: string }) => {
      const notebook = await postNotebookAutoSubject(subjectId)
      return { notebook, ...input }
    },
    onSuccess: ({ notebook, lessonId, question }) => {
      if (lessonId && question) leaveLessonDraft(notebook.id, question)
      router.push(lessonId ? askLessonHref(notebook.id, lessonId) : `/notebooks/view/?id=${notebook.id}`)
    },
  })
}
