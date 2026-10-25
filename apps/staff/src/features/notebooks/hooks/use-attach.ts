"use client"

import { keys, postArtifactAttachToLesson, type AttachedResource } from "@ihsp/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"

/** `POST /v1/notebooks/{id}/artifacts/{aid}/attach-to-lesson`: the lesson page then shows the new material. */
export function useAttachArtifact(notebookId: string, artifactId: string) {
  const queryClient = useQueryClient()
  return useMutation<AttachedResource, unknown, { lessonId: string; role: "material" | "attachment" }>({
    mutationFn: ({ lessonId, role }) =>
      postArtifactAttachToLesson(notebookId, artifactId, { lesson_id: lessonId, role }),
    onSuccess: (resource) => {
      void queryClient.invalidateQueries({ queryKey: keys.staff.lesson(resource.lesson_id) })
    },
  })
}
