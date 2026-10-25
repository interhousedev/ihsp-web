"use client"

import { putStaffAttendance, type AttendanceSheet, type AttendanceSubmitBody } from "@ihsp/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { applyAttendanceSheet, invalidateAttendanceViews } from "../utils/cache"

/** `PUT /v1/staff/lessons/{id}/attendance` (ACA-11): the saved sheet replaces the cached one and the lists refresh. */
export function useSubmitAttendance(lessonId: string) {
  const queryClient = useQueryClient()
  return useMutation<AttendanceSheet, unknown, AttendanceSubmitBody>({
    mutationFn: (body) => putStaffAttendance(lessonId, body),
    onSuccess: (sheet) => {
      applyAttendanceSheet(queryClient, lessonId, sheet)
      void invalidateAttendanceViews(queryClient)
    },
  })
}
