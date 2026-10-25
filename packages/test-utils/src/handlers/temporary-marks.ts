import type { TemporaryMark, TemporaryMarkBody } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { staffLessonFor, temporaryMarks as seed } from "../fixtures/classwork"
import { FIXTURE_NOW } from "../fixtures/world"
import { apiUrl, notFound, param, readJson } from "./utils"

let marks: TemporaryMark[] = [...seed]

/** Restores the seeded temporary marks (the preload calls it between tests). */
export function resetTemporaryMarks(): void {
  marks = [...seed]
}

export const temporaryMarksHandlers = [
  http.get(apiUrl("/v1/staff/temporary-marks/pending"), () => HttpResponse.json({ items: marks })),
  http.get(apiUrl("/v1/staff/lessons/:id/temporary-marks"), ({ params }) => {
    const id = param(params, "id")
    if (!staffLessonFor(id)) return notFound("Lesson")
    return HttpResponse.json({ items: marks.filter((mark) => mark.lesson_id === id) })
  }),
  http.put(apiUrl("/v1/staff/lessons/:id/temporary-marks/:studentId"), async ({ params, request }) => {
    const id = param(params, "id")
    const studentId = param(params, "studentId")
    const lesson = staffLessonFor(id)
    if (!lesson) return notFound("Lesson")
    const row = lesson.attendance.roster.find((item) => item.user_id === studentId)
    if (!row) {
      return HttpResponse.json(
        {
          type: "temporary-mark/student-not-in-lesson",
          title: "Student not in lesson",
          status: 422,
          message_key: "errors.temporary-mark.student-not-in-lesson",
          params: {},
        },
        { status: 422, headers: { "Content-Type": "application/problem+json" } },
      )
    }
    const body = await readJson<TemporaryMarkBody>(request)
    const existing = marks.find((mark) => mark.lesson_id === id && mark.student_id === studentId)
    const mark: TemporaryMark = {
      ...(existing ?? seed[0]!),
      id: existing?.id ?? `00000000-0000-7000-8000-${String(marks.length + 100).padStart(12, "0")}`,
      lesson_id: id,
      lesson_date: lesson.lesson.date,
      lesson_period: lesson.lesson.period,
      student_id: studentId,
      student_name: `${row.last_name} ${row.first_name}`,
      value: Number(body.value),
      comment: body.comment ?? null,
      updated_at: FIXTURE_NOW,
    }
    marks = [...marks.filter((item) => item !== existing), mark]
    return HttpResponse.json(mark)
  }),
  http.delete(apiUrl("/v1/staff/lessons/:id/temporary-marks/:studentId"), ({ params }) => {
    const id = param(params, "id")
    const studentId = param(params, "studentId")
    const before = marks.length
    marks = marks.filter((mark) => !(mark.lesson_id === id && mark.student_id === studentId))
    if (marks.length === before) return notFound("Temporary mark")
    return new HttpResponse(null, { status: 204 })
  }),
]
