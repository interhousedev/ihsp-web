import type {
  AttendanceExcuseBody,
  AttendanceSubmitBody,
  HomeworkDoneBody,
  HomeworkNoteBody,
  JournalToggleBody,
  StaffHomeworkBody,
  StaffTopicBody,
} from "@ihsp/api"
import { HttpResponse, http } from "msw"
import {
  adminAttendanceReport,
  curatorStudents,
  groupAttendanceReport,
  homeworkByStatus,
  homeworkItems,
  journal,
  journalOptions,
  missingAttendance,
  staffLessonFor,
  staffToday,
  studentAttendance,
  studentLessonFor,
  studentToday,
} from "../fixtures/classwork"
import { FIXTURE_NOW } from "../fixtures/world"
import { staffWorkOffsOf } from "./work-offs-staff"
import { apiUrl, notFound, param, query, readJson } from "./utils"

function csv(rows: (string | number)[][], filename: string): Response {
  const body = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n")
  return new HttpResponse(`${body}\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}

function homeworkFor(lessonId: string) {
  return homeworkItems.find((item) => item.lesson_id === lessonId)
}

/** The staff lesson with the work-offs the work-off handlers hold for it. */
function lessonWithWorkOffs(id: string) {
  const lesson = staffLessonFor(id)
  return lesson ? { ...lesson, attendance: { ...lesson.attendance, work_offs: staffWorkOffsOf(id) } } : undefined
}

export const classworkHandlers = [
  // --- Student ---
  http.get(apiUrl("/v1/me/today"), () => HttpResponse.json(studentToday)),
  http.get(apiUrl("/v1/me/lessons/:id"), ({ params }) => {
    const lesson = studentLessonFor(param(params, "id"))
    return lesson ? HttpResponse.json(lesson) : notFound("Lesson")
  }),
  http.get(apiUrl("/v1/me/homework"), ({ request }) => {
    const status = query(request).get("status")
    const known =
      status === "overdue" || status === "upcoming" || status === "later" || status === "done" ? status : null
    return HttpResponse.json(homeworkByStatus(known))
  }),
  http.put(apiUrl("/v1/me/homework/:lessonId/done"), async ({ params, request }) => {
    const item = homeworkFor(param(params, "lessonId"))
    if (!item) return notFound("Homework")
    const body = await readJson<HomeworkDoneBody>(request)
    return HttpResponse.json({
      ...item,
      done_at: body.done ? FIXTURE_NOW : null,
      days_overdue: body.done ? 0 : item.days_overdue,
      updated: false,
    })
  }),
  http.put(apiUrl("/v1/me/homework/:lessonId/note"), async ({ params, request }) => {
    const item = homeworkFor(param(params, "lessonId"))
    if (!item) return notFound("Homework")
    const body = await readJson<HomeworkNoteBody>(request)
    return HttpResponse.json({ ...item, note: body.note ?? null })
  }),
  http.get(apiUrl("/v1/me/attendance"), ({ request }) => {
    const search = query(request)
    return HttpResponse.json({
      ...studentAttendance,
      from: search.get("from") ?? studentAttendance.from,
      to: search.get("to") ?? studentAttendance.to,
    })
  }),

  // --- Teacher ---
  http.get(apiUrl("/v1/staff/today"), () => HttpResponse.json(staffToday)),
  http.get(apiUrl("/v1/staff/lessons/:id"), ({ params }) => {
    const lesson = lessonWithWorkOffs(param(params, "id"))
    return lesson ? HttpResponse.json(lesson) : notFound("Lesson")
  }),
  http.put(apiUrl("/v1/staff/lessons/:id/homework"), async ({ params, request }) => {
    const lesson = staffLessonFor(param(params, "id"))
    if (!lesson) return notFound("Lesson")
    const body = await readJson<StaffHomeworkBody>(request)
    return HttpResponse.json({
      ...lesson,
      homework: {
        text: body.text ?? "",
        due_date: body.due_date ?? "2026-10-09",
        due_auto: body.due_date === undefined,
      },
    })
  }),
  http.delete(apiUrl("/v1/staff/lessons/:id/homework"), ({ params }) => {
    const lesson = staffLessonFor(param(params, "id"))
    return lesson ? HttpResponse.json({ ...lesson, homework: null }) : notFound("Lesson")
  }),
  http.put(apiUrl("/v1/staff/lessons/:id/topic"), async ({ params, request }) => {
    const lesson = staffLessonFor(param(params, "id"))
    if (!lesson) return notFound("Lesson")
    const body = await readJson<StaffTopicBody>(request)
    return HttpResponse.json({ ...lesson, lesson: { ...lesson.lesson, topic: body.topic ?? null } })
  }),
  // Echoes the submitted sheet with `version = base_version + 1`; conflicts come from `errorHandlers.conflictAttendance`.
  http.put(apiUrl("/v1/staff/lessons/:id/attendance"), async ({ params, request }) => {
    const lesson = lessonWithWorkOffs(param(params, "id"))
    if (!lesson) return notFound("Lesson")
    const body = await readJson<AttendanceSubmitBody>(request)
    const absent = new Set(body.absent ?? [])
    const late = new Set(body.late ?? [])
    return HttpResponse.json({
      ...lesson.attendance,
      submitted: true,
      version: (body.base_version ?? lesson.attendance.version) + 1,
      roster: lesson.attendance.roster.map((item) => ({
        ...item,
        absent: absent.has(item.user_id),
        late: late.has(item.user_id),
        counted: item.counted || absent.has(item.user_id) || late.has(item.user_id),
      })),
      submitted_at: FIXTURE_NOW,
      submitted_by: lesson.lesson.teacher,
    })
  }),
  http.put(apiUrl("/v1/staff/lessons/:id/attendance/excuse"), async ({ params, request }) => {
    const lesson = staffLessonFor(param(params, "id"))
    if (!lesson) return notFound("Lesson")
    const body = await readJson<AttendanceExcuseBody>(request)
    return HttpResponse.json({
      ...lesson.attendance,
      roster: lesson.attendance.roster.map((item) =>
        item.user_id === body.student_id
          ? { ...item, excused: body.excused ?? true, excuse_comment: body.comment ?? null }
          : item,
      ),
    })
  }),
  http.get(apiUrl("/v1/staff/journal/options"), () => HttpResponse.json(journalOptions)),
  http.get(apiUrl("/v1/staff/journal"), ({ request }) => {
    const search = query(request)
    const option = journalOptions.find((item) => item.subject.id === search.get("subject_id"))
    return HttpResponse.json({
      ...journal,
      subject: option?.subject ?? journal.subject,
      audience_key: search.get("audience_key") ?? journal.audience_key,
    })
  }),
  http.post(apiUrl("/v1/staff/journal/toggle"), async ({ request }) => {
    const body = await readJson<JournalToggleBody>(request)
    return HttpResponse.json({ attendance_version: (body.base_version ?? 0) + 1 })
  }),
  http.get(apiUrl("/v1/staff/journal.csv"), () =>
    csv(
      [
        ["Student", ...journal.lessons.map((lesson) => lesson.date), "Absences"],
        ...journal.students.map((student) => [
          `${student.last_name} ${student.first_name}`,
          ...student.cells.map((cell) => (cell.absent ? "Н" : cell.marks.join("/"))),
          student.absences,
        ]),
      ],
      "journal.csv",
    ),
  ),

  // --- Curator ---
  http.get(apiUrl("/v1/staff/groups/:id/attendance"), ({ request }) => {
    const search = query(request)
    return HttpResponse.json({
      ...groupAttendanceReport,
      view: search.get("view") ?? groupAttendanceReport.view,
      from: search.get("from") ?? groupAttendanceReport.from,
      to: search.get("to") ?? groupAttendanceReport.to,
    })
  }),
  http.get(apiUrl("/v1/staff/groups/:id/attendance.csv"), () =>
    csv(
      [
        ["Label", "Absences", "Excused", "Lessons", "Rate"],
        ...groupAttendanceReport.rows.map((row) => [row.label, row.absences, row.excused, row.lessons, row.rate ?? ""]),
      ],
      "attendance.csv",
    ),
  ),
  http.get(apiUrl("/v1/staff/groups/:id/students"), () => HttpResponse.json(curatorStudents)),

  // --- Admin ---
  http.get(apiUrl("/v1/admin/attendance/missing"), () => HttpResponse.json(missingAttendance)),
  http.get(apiUrl("/v1/admin/attendance.csv"), () =>
    csv(
      [
        ["Label", "Absences", "Excused", "Lessons", "Rate"],
        ...adminAttendanceReport.rows.map((row) => [row.label, row.absences, row.excused, row.lessons, row.rate ?? ""]),
      ],
      "attendance.csv",
    ),
  ),
  http.get(apiUrl("/v1/admin/attendance"), ({ request }) => {
    const search = query(request)
    return HttpResponse.json({
      ...adminAttendanceReport,
      view: search.get("view") ?? adminAttendanceReport.view,
      from: search.get("from") ?? adminAttendanceReport.from,
      to: search.get("to") ?? adminAttendanceReport.to,
    })
  }),
]
