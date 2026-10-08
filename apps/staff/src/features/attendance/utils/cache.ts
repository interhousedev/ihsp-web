import { keys, type AttendanceSheet, type StaffLesson } from "@ihsp/api"
import type { QueryClient } from "@tanstack/react-query"

/** Lists that show attendance state: Today, the timetable warnings and the journal grid. */
export function invalidateAttendanceViews(queryClient: QueryClient): Promise<unknown> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: keys.staff.today() }),
    queryClient.invalidateQueries({ queryKey: ["staff", "timetable"] }),
    queryClient.invalidateQueries({ queryKey: ["staff", "journal"] }),
  ])
}

/** Puts a sheet returned by the server into the cached lesson page. */
export function applyAttendanceSheet(queryClient: QueryClient, lessonId: string, sheet: AttendanceSheet): void {
  queryClient.setQueryData<StaffLesson>(keys.staff.lesson(lessonId), (current) =>
    current
      ? { ...current, attendance: sheet, lesson: { ...current.lesson, attendance_submitted: sheet.submitted } }
      : current,
  )
}
