"use client"

import {
  deleteWorkOffTemplate,
  getWorkOffTemplatesQuery,
  keys,
  postWorkOffTemplate,
  putWorkOffTemplate,
  type WorkOffTemplate,
  type WorkOffTemplateBody,
} from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

/** The teacher's work-off templates and their mutations (WO-1); every change reads the list again. */
export function useWorkOffTemplates() {
  const queryClient = useQueryClient()
  const query = useQuery(getWorkOffTemplatesQuery())
  const refresh = () => queryClient.invalidateQueries({ queryKey: keys.staff.workOffTemplates() })
  const create = useMutation<WorkOffTemplate, unknown, WorkOffTemplateBody>({
    mutationFn: (body) => postWorkOffTemplate(body),
    onSuccess: refresh,
  })
  const update = useMutation<WorkOffTemplate, unknown, { id: string; body: WorkOffTemplateBody }>({
    mutationFn: ({ id, body }) => putWorkOffTemplate(id, body),
    onSuccess: refresh,
  })
  const remove = useMutation<void, unknown, string>({
    mutationFn: (id) => deleteWorkOffTemplate(id),
    onSuccess: refresh,
  })
  return { query, create, update, remove }
}
