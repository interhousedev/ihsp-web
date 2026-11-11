"use client"

import {
  ApiError,
  getMeHomeworkQuery,
  getMeWorkOffsQuery,
  keys,
  putHomeworkDone,
  putHomeworkNote,
  submitHomework,
  uploadFile,
  withdrawHomeworkSubmission,
  type HomeworkItem,
  type HomeworkSubmission,
} from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { applyHomeworkUpdate, type HomeworkStatus } from "../utils/apply-homework-update"

export function useHomeworkList(status: HomeworkStatus) {
  return useQuery(getMeHomeworkQuery({ status }))
}

/** The student's open work-off tasks (`GET /v1/me/work-offs?status=open`), shared with the attendance card. */
export function useOpenWorkOffs() {
  return useQuery(getMeWorkOffsQuery({ status: "open" }))
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

function refreshHomework(queryClient: ReturnType<typeof useQueryClient>, lessonId: string): void {
  void queryClient.invalidateQueries({ queryKey: keys.me.homework() })
  void queryClient.invalidateQueries({ queryKey: keys.lessons.detail(lessonId) })
}

/**
 * `PUT /v1/me/homework/{lesson_id}/submission`: uploads the picked files (`purpose: "link"`), then saves or replaces the
 * submission. A file the backend rejects after the upload stops the submission.
 */
export function useSubmitHomework() {
  const queryClient = useQueryClient()
  return useMutation<HomeworkSubmission, unknown, { lessonId: string; files: File[]; comment: string | null }>({
    mutationFn: async ({ lessonId, files, comment }) => {
      const uploaded = await Promise.all(files.map((file) => uploadFile(file, "link")))
      const rejected = uploaded.find((file) => file.status === "rejected")
      if (rejected) {
        throw new ApiError({ type: "files/rejected", status: 422, title: `${rejected.name} was rejected` })
      }
      return submitHomework(lessonId, { file_ids: uploaded.map((file) => file.id), comment })
    },
    onSuccess: (_submission, { lessonId }) => refreshHomework(queryClient, lessonId),
  })
}

/** `DELETE /v1/me/homework/{lesson_id}/submission`: takes the submission back. */
export function useWithdrawHomework() {
  const queryClient = useQueryClient()
  return useMutation<void, unknown, { lessonId: string }>({
    mutationFn: ({ lessonId }) => withdrawHomeworkSubmission(lessonId),
    onSuccess: (_result, { lessonId }) => refreshHomework(queryClient, lessonId),
  })
}
