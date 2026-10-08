"use client"

import { keys, putAttendanceExcuse, type AttendanceExcuseBody, type AttendanceSheet } from "@ihsp/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { applyAttendanceSheet } from "../../attendance/utils/cache"

/** `PUT /v1/staff/lessons/{id}/attendance/excuse` (ACA-20, STF-13): the curator marks an absence as excused. */
export function useSetExcuse(lessonId: string) {
  const queryClient = useQueryClient()
  return useMutation<AttendanceSheet, unknown, AttendanceExcuseBody>({
    mutationFn: (body) => putAttendanceExcuse(lessonId, body),
    onSuccess: (sheet) => {
      applyAttendanceSheet(queryClient, lessonId, sheet)
      void queryClient.invalidateQueries({ queryKey: ["staff", "groups"] })
      void queryClient.invalidateQueries({ queryKey: ["staff", "journal"] })
      void queryClient.invalidateQueries({ queryKey: keys.staff.lesson(lessonId) })
    },
  })
}
