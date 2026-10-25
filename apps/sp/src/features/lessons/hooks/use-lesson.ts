"use client"

import {
  deleteLessonResource,
  getMeLessonQuery,
  keys,
  postLessonResources,
  type ResourceCreateBody,
  type ResourceItem,
} from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export function useLesson(id: string | null) {
  return useQuery({ ...getMeLessonQuery(id ?? ""), enabled: id !== null })
}

/** `POST /v1/lessons/{id}/resources` as an attachment (WEB-10): a file from My files, a fresh upload or a URL. */
export function useAddAttachment(lessonId: string) {
  const queryClient = useQueryClient()
  return useMutation<ResourceItem[], unknown, Omit<ResourceCreateBody, "role">>({
    mutationFn: (body) => postLessonResources(lessonId, { ...body, role: "attachment" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.lessons.detail(lessonId) }),
  })
}

/** `DELETE /v1/lessons/{id}/resources/{link_id}`: the student's own attachment (WEB-11). */
export function useDeleteAttachment(lessonId: string) {
  const queryClient = useQueryClient()
  return useMutation<void, unknown, string>({
    mutationFn: (linkId) => deleteLessonResource(lessonId, linkId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.lessons.detail(lessonId) }),
  })
}
