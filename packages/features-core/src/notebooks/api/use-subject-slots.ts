"use client"

import {
  getNotebookSubjectSlotsQuery,
  keys,
  postNotebookAutoSubject,
  type NotebookDetail,
  type SubjectNotebookSlot,
} from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

/** A slot for every subject (teachers: subject and group) of the user; `notebook_id` is null until first opened. */
export function useSubjectNotebookSlots(enabled = true) {
  return useQuery({ ...getNotebookSubjectSlotsQuery(), enabled })
}

/** Gets or creates the notebook of a slot (idempotent on the server) and refreshes the lists. */
export function useOpenSubjectNotebook() {
  const client = useQueryClient()
  return useMutation<NotebookDetail, Error, SubjectNotebookSlot>({
    mutationFn: (slot) => postNotebookAutoSubject(slot.subject_id, { group_id: slot.group_id }),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.notebooks.all() }),
  })
}
