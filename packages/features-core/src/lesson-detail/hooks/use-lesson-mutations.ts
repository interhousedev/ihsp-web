"use client"

import {
  deleteLessonResource,
  deleteStaffHomework,
  keys,
  postLessonResourceHide,
  postLessonResources,
  putStaffHomework,
  putStaffTopic,
  type ResourceCreateBody,
  type ResourceItem,
  type StaffHomeworkBody,
  type StaffLesson,
} from "@ihsp/api"
import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query"

function applyLesson(queryClient: QueryClient, lesson: StaffLesson): void {
  queryClient.setQueryData<StaffLesson>(keys.staff.lesson(lesson.lesson.id), lesson)
}

/** Lists that show the topic or the homework badge of a lesson (staff lists and the admin lesson list). */
function invalidateLessonLists(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: keys.staff.today() })
  void queryClient.invalidateQueries({ queryKey: ["staff", "timetable"] })
  void queryClient.invalidateQueries({ queryKey: ["staff", "journal"] })
  void queryClient.invalidateQueries({ queryKey: keys.admin.lessons() })
}

/** `PUT /v1/staff/lessons/{id}/topic` (ACA-21). */
export function useSaveTopic(lessonId: string) {
  const queryClient = useQueryClient()
  return useMutation<StaffLesson, unknown, string>({
    mutationFn: (topic) => putStaffTopic(lessonId, { topic }),
    onSuccess: (lesson) => {
      applyLesson(queryClient, lesson)
      invalidateLessonLists(queryClient)
    },
  })
}

/** `PUT /v1/staff/lessons/{id}/homework` (STF-7, ACA-10). */
export function useSaveHomework(lessonId: string) {
  const queryClient = useQueryClient()
  return useMutation<StaffLesson, unknown, StaffHomeworkBody>({
    mutationFn: (body) => putStaffHomework(lessonId, body),
    onSuccess: (lesson) => {
      applyLesson(queryClient, lesson)
      invalidateLessonLists(queryClient)
    },
  })
}

/** `DELETE /v1/staff/lessons/{id}/homework`. */
export function useDeleteHomework(lessonId: string) {
  const queryClient = useQueryClient()
  return useMutation<StaffLesson, unknown, void>({
    mutationFn: () => deleteStaffHomework(lessonId),
    onSuccess: (lesson) => {
      applyLesson(queryClient, lesson)
      invalidateLessonLists(queryClient)
    },
  })
}

/** `POST /v1/lessons/{id}/resources` (STF-5): a material or an attachment, optionally for other lessons too. */
export function useAddResource(lessonId: string) {
  const queryClient = useQueryClient()
  return useMutation<ResourceItem[], unknown, ResourceCreateBody>({
    mutationFn: (body) => postLessonResources(lessonId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff", "lessons"] }),
  })
}

/** `DELETE /v1/lessons/{id}/resources/{link_id}`: the teacher's own material or attachment. */
export function useDeleteResource(lessonId: string) {
  const queryClient = useQueryClient()
  return useMutation<void, unknown, string>({
    mutationFn: (linkId) => deleteLessonResource(lessonId, linkId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.staff.lesson(lessonId) }),
  })
}

/** `POST /v1/lessons/{id}/resources/{link_id}/hide` (STF-6, UF-STF-08). */
export function useHideResource(lessonId: string) {
  const queryClient = useQueryClient()
  return useMutation<ResourceItem, unknown, { linkId: string; hidden: boolean }>({
    mutationFn: ({ linkId, hidden }) => postLessonResourceHide(lessonId, linkId, { hidden }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.staff.lesson(lessonId) }),
  })
}
