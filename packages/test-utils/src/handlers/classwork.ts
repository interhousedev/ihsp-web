import type {
  AttendanceExcuseBody,
  AttendanceSubmitBody,
  HomeworkDoneBody,
  HomeworkNoteBody,
  HomeworkBoard,
  HomeworkReviewBody,
  HomeworkSettings,
  HomeworkSettingsBody,
  HomeworkSubmission,
  HomeworkSubmissionBody,
  LessonHomeworkSwitchesBody,
  StaffSubmissionRow,
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
  lessonHomeworkSubmissionsFor,
  missingAttendance,
  staffLessonFor,
  staffToday,
  studentAttendance,
  studentLessonFor,
  studentToday,
} from "../fixtures/classwork"
import { FIXTURE_NOW } from "../fixtures/world"
import { staffWorkOffsOf } from "./work-offs-staff"
import { apiUrl, noContent, notFound, param, query, readJson } from "./utils"

function csv(rows: (string | number)[][], filename: string): Response {
  const body = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n")
  return new HttpResponse(`${body}\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}

/** Submissions saved through the handlers, by lesson id; the homework list reflects them. */
const submissions = new Map<string, HomeworkSubmission>()

function withSubmission<T extends { lesson_id: string }>(item: T): T & { submission: object | null } {
  const saved = submissions.get(item.lesson_id)
  return {
    ...item,
    submission: saved
      ? {
          status: saved.status,
          file_count: saved.files.length,
          submitted_at: saved.submitted_at,
          review_status: saved.review_status,
          grade: saved.grade,
        }
      : null,
  }
}

function homeworkFor(lessonId: string) {
  return homeworkItems.find((item) => item.lesson_id === lessonId)
}

/** The teacher's homework defaults; `PUT /v1/staff/homework/settings` changes them. */
let homeworkSettings: HomeworkSettings = { accept_by_default: true, notify_on_submission: true }

/** A submission of the teacher-view fixture by its id. */
function staffSubmissionRow(id: string): StaffSubmissionRow | undefined {
  return lessonHomeworkSubmissionsFor("").students.find((row) => row.id === id)
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
    return HttpResponse.json(homeworkByStatus(known).map(withSubmission))
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
  http.get(apiUrl("/v1/me/homework/:lessonId/submission"), ({ params }) => {
    const saved = submissions.get(param(params, "lessonId"))
    return saved ? HttpResponse.json(saved) : notFound("Submission")
  }),
  http.put(apiUrl("/v1/me/homework/:lessonId/submission"), async ({ params, request }) => {
    const lessonId = param(params, "lessonId")
    const item = homeworkFor(lessonId)
    if (!item) return notFound("Homework")
    const body = await readJson<HomeworkSubmissionBody>(request)
    const saved: HomeworkSubmission = {
      lesson_id: lessonId,
      status: item.due_date !== null && item.days_overdue > 0 ? "late" : "submitted",
      comment: body.comment ?? null,
      files: (body.file_ids ?? []).map((id, index) => ({
        id,
        name: `file-${index + 1}.pdf`,
        size: 1000,
        content_type: "application/pdf",
      })),
      submitted_at: FIXTURE_NOW,
      text: body.text ?? null,
      review_status: "pending",
      grade: null,
      teacher_comment: null,
      previous_comment: null,
      reviewed_at: null,
      reviewer: null,
    }
    submissions.set(lessonId, saved)
    return HttpResponse.json(saved)
  }),
  http.delete(apiUrl("/v1/me/homework/:lessonId/submission"), ({ params }) => {
    submissions.delete(param(params, "lessonId"))
    return noContent()
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
  http.get(apiUrl("/v1/staff/lessons/:id/homework/submissions"), ({ params }) => {
    const id = param(params, "id")
    return staffLessonFor(id) ? HttpResponse.json(lessonHomeworkSubmissionsFor(id)) : notFound("Lesson")
  }),
  http.put(apiUrl("/v1/staff/lessons/:id/homework"), async ({ params, request }) => {
    const lesson = staffLessonFor(param(params, "id"))
    if (!lesson) return notFound("Lesson")
    const body = await readJson<StaffHomeworkBody>(request)
    const homework = lesson.homework
    return HttpResponse.json({
      ...lesson,
      homework: {
        text: body.text ?? homework?.text ?? "",
        due_date: body.due_date ?? "2026-10-09",
        due_auto: body.due_date === undefined || body.due_date === null,
        source: homework?.source ?? "teacher",
        accept_submissions:
          body.accept_submissions ?? homework?.accept_submissions ?? homeworkSettings.accept_by_default,
        notify: homework?.notify ?? null,
        notify_effective: homework?.notify_effective ?? homeworkSettings.notify_on_submission,
        emis_files: homework?.emis_files ?? [],
        emis_topic_description: homework?.emis_topic_description ?? null,
      },
    })
  }),
  http.patch(apiUrl("/v1/staff/lessons/:id/homework/settings"), async ({ params, request }) => {
    const lesson = staffLessonFor(param(params, "id"))
    if (!lesson?.homework) return notFound("Homework")
    const body = await readJson<LessonHomeworkSwitchesBody>(request)
    const notify = body.notify === undefined ? lesson.homework.notify : body.notify
    return HttpResponse.json({
      ...lesson,
      homework: {
        ...lesson.homework,
        accept_submissions: body.accept_submissions ?? lesson.homework.accept_submissions,
        notify,
        notify_effective: notify ?? homeworkSettings.notify_on_submission,
      },
    })
  }),
  http.get(apiUrl("/v1/staff/homework"), ({ request }) => {
    const url = new URL(request.url)
    const board: HomeworkBoard = {
      subject: { id: url.searchParams.get("subject_id") ?? "", name: "", short_name: null },
      audience_key: url.searchParams.get("audience_key") ?? "",
      label: "",
      lessons: [],
      settings: homeworkSettings,
    }
    return HttpResponse.json(board)
  }),
  http.get(apiUrl("/v1/staff/homework/settings"), () => HttpResponse.json(homeworkSettings)),
  http.put(apiUrl("/v1/staff/homework/settings"), async ({ request }) => {
    const body = await readJson<HomeworkSettingsBody>(request)
    homeworkSettings = {
      accept_by_default: body.accept_by_default ?? homeworkSettings.accept_by_default,
      notify_on_submission: body.notify_on_submission ?? homeworkSettings.notify_on_submission,
    }
    return HttpResponse.json(homeworkSettings)
  }),
  http.get(apiUrl("/v1/staff/homework/submissions/:id"), ({ params }) => {
    const row = staffSubmissionRow(param(params, "id"))
    return row ? HttpResponse.json(row) : notFound("Submission")
  }),
  http.put(apiUrl("/v1/staff/homework/submissions/:id/review"), async ({ params, request }) => {
    const row = staffSubmissionRow(param(params, "id"))
    if (!row) return notFound("Submission")
    const body = await readJson<HomeworkReviewBody>(request)
    const graded = body.action === "grade"
    return HttpResponse.json({
      ...row,
      review_status: graded ? "graded" : "returned",
      grade: graded ? (body.grade ?? null) : null,
      teacher_comment: body.comment ?? null,
      reviewed_at: FIXTURE_NOW,
    } satisfies StaffSubmissionRow)
  }),
  http.delete(apiUrl("/v1/staff/homework/submissions/:id/review"), ({ params }) =>
    staffSubmissionRow(param(params, "id")) ? noContent() : notFound("Submission"),
  ),
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
