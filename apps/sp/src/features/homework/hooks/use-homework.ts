"use client"

import { getMeHomeworkQuery, putHomeworkDone, putHomeworkNote, type HomeworkItem } from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { applyHomeworkUpdate, type HomeworkStatus } from "../utils/apply-homework-update"

export function useHomeworkList(status: HomeworkStatus) {
  return useQuery(getMeHomeworkQuery({ status }))
}

/** `PUT /v1/me/homework/{lesson_id}/done`: ticks or unticks an item (WEB-19). */
export function useSetHomeworkDone() {
  const queryClient = useQueryClient()
  return useMutation<HomeworkItem, unknown, { lessonId: string; done: boolean }>({
    mutationFn: ({ lessonId, done }) => putHomeworkDone(lessonId, { done }),
    onSuccess: (item) => applyHomeworkUpdate(queryClient, item),
  })
}

/** `PUT /v1/me/homework/{lesson_id}/note`: the private note, up to 1000 characters (WEB-20). */
export function useSetHomeworkNote() {
  const queryClient = useQueryClient()
  return useMutation<HomeworkItem, unknown, { lessonId: string; note: string | null }>({
    mutationFn: ({ lessonId, note }) => putHomeworkNote(lessonId, { note }),
    onSuccess: (item) => applyHomeworkUpdate(queryClient, item),
  })
}
