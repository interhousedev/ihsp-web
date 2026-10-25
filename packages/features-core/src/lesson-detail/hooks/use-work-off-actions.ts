"use client"

import { deleteWorkOff, keys, patchWorkOff, type WorkOffItem, type WorkOffPatchBody } from "@ihsp/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"

/** `PATCH` and `DELETE /v1/staff/work-offs/{id}`: afterwards the lesson is read again, so the sheet shows the result. */
export function useWorkOffActions(lessonId: string) {
  const queryClient = useQueryClient()
  const refresh = () => queryClient.invalidateQueries({ queryKey: keys.staff.lesson(lessonId) })
  const patch = useMutation<WorkOffItem, unknown, { id: string; body: WorkOffPatchBody }>({
    mutationFn: ({ id, body }) => patchWorkOff(id, body),
    onSuccess: refresh,
  })
  const remove = useMutation<void, unknown, string>({
    mutationFn: (id) => deleteWorkOff(id),
    onSuccess: refresh,
  })
  return { patch, remove }
}
