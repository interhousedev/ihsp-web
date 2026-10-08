"use client"

import { keys, postJournalToggle, type Journal, type JournalParams, type JournalToggleResult } from "@ihsp/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { applyToggle, withLessonVersion, type ToggleChange } from "../utils/apply-toggle"

/**
 * `POST /v1/staff/journal/toggle` for a cell (STF-9): shows the change at once and rolls back on an error. Toggles run
 * one after another and each one reads the lesson's latest version from the cache, so quick taps in one column do
 * not conflict with each other. On any error the grid is loaded again.
 */
export function useToggleAbsence(params: JournalParams) {
  const queryClient = useQueryClient()
  const key = keys.staff.journal.grid(params)

  return useMutation<JournalToggleResult, unknown, ToggleChange, { previous: Journal | undefined }>({
    scope: { id: "journal-toggle" },
    mutationFn: (change) => {
      const journal = queryClient.getQueryData<Journal>(key)
      const version = journal?.lessons.find((lesson) => lesson.id === change.lessonId)?.version ?? 0
      return postJournalToggle({
        lesson_id: change.lessonId,
        student_id: change.studentId,
        absent: change.absent,
        base_version: version,
      })
    },
    onMutate: async (change) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Journal>(key)
      if (previous) queryClient.setQueryData<Journal>(key, applyToggle(previous, change))
      return { previous }
    },
    onError: (_error, _change, context) => {
      if (context?.previous) queryClient.setQueryData<Journal>(key, context.previous)
      void queryClient.invalidateQueries({ queryKey: key })
    },
    onSuccess: (result, change) => {
      queryClient.setQueryData<Journal>(key, (current) =>
        current ? withLessonVersion(current, change.lessonId, result.attendance_version) : current,
      )
      void queryClient.invalidateQueries({ queryKey: keys.staff.today() })
      void queryClient.invalidateQueries({ queryKey: ["staff", "timetable"] })
      void queryClient.invalidateQueries({ queryKey: keys.staff.lesson(change.lessonId) })
    },
  })
}
