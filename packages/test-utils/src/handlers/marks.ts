import { HttpResponse, http } from "msw"
import {
  dayGrades,
  findSubjectCard,
  marks,
  recordBook,
  semesterGrades,
  subjectCards,
  subjectDetailPhysics,
  syncRuns,
} from "../fixtures/marks"
import { ids, weekLessons } from "../fixtures/world"
import { accepted, apiUrl, notFound, paginate, param, query } from "./utils"

/** The subject hub list: the latest past lessons first, then the next 14 days; attendance and marks only when past. */
function subjectLessonRows(subjectId: string, now: number) {
  const rows = weekLessons
    .filter((lesson) => lesson.subject.id === subjectId)
    .map((lesson) => {
      const past = new Date(lesson.starts_at).getTime() < now
      return {
        lesson_id: lesson.id,
        date: lesson.date,
        starts_at: lesson.starts_at,
        kind: lesson.kind,
        topic: lesson.topic,
        marks: past
          ? marks.filter((item) => item.lesson_id === lesson.id).map((item) => ({ type: item.type, value: item.value }))
          : [],
        attendance: past ? ("present" as const) : null,
        materials_count: 0,
        past,
      }
    })
  return rows
}

export const marksHandlers = [
  http.get(apiUrl("/v1/me/subjects/:subjectId/lessons"), ({ params, request }) => {
    const subjectId = param(params, "subjectId")
    if (!findSubjectCard(subjectId)) return notFound("Subject")
    const search = query(request)
    const limit = Number(search.get("past_limit") ?? 10)
    const offset = Number(search.get("past_offset") ?? 0)
    const rows = subjectLessonRows(subjectId, Date.now())
    const past = rows.filter((row) => row.past).toSorted((a, b) => b.starts_at.localeCompare(a.starts_at))
    const upcoming = rows.filter((row) => !row.past).toSorted((a, b) => a.starts_at.localeCompare(b.starts_at))
    return HttpResponse.json({
      items: [...past.slice(offset, offset + limit), ...(offset === 0 ? upcoming : [])],
      has_more_past: past.length > offset + limit,
    })
  }),
  http.get(apiUrl("/v1/me/lesson-results"), ({ request }) => {
    const search = query(request)
    const from = search.get("from") ?? ""
    const to = search.get("to") ?? "9999-12-31"
    const now = Date.now()
    return HttpResponse.json(
      weekLessons
        .filter((lesson) => lesson.date >= from && lesson.date <= to && new Date(lesson.starts_at).getTime() < now)
        .map((lesson, index) => ({
          lesson_id: lesson.id,
          attendance:
            index % 4 === 3 ? ("absent" as const) : index % 5 === 2 ? ("late" as const) : ("present" as const),
          mark: marks.find((item) => item.lesson_id === lesson.id)?.value ?? null,
        })),
    )
  }),
  http.get(apiUrl("/v1/me/subjects"), () => HttpResponse.json(subjectCards)),
  http.get(apiUrl("/v1/me/subjects/:subjectId"), ({ params, request }) => {
    const subjectId = param(params, "subjectId")
    const card = findSubjectCard(subjectId)
    if (!card) return notFound("Subject")
    const semester = Number(query(request).get("semester") ?? 4)
    if (subjectId === ids.physics) return HttpResponse.json({ ...subjectDetailPhysics, semester })
    const subjectMarks = marks.filter((item) => item.subject.id === subjectId)
    return HttpResponse.json({
      subject: card.subject,
      semester,
      teachers: card.teachers,
      averages: { lesson: card.semester_mark, midterm: null, final: null },
      semester_mark: card.semester_mark,
      emis_rating: card.emis_rating,
      absence_rate: null,
      lessons: weekLessons
        .filter((lesson) => lesson.subject.id === subjectId)
        .map((lesson) => ({
          ...lesson,
          marks: subjectMarks.filter((item) => item.lesson_id === lesson.id),
          attendance: lesson.date < "2026-10-07" ? ("present" as const) : ("not_taken" as const),
          homework_text: null,
        })),
      marks: subjectMarks,
      materials: [],
    })
  }),
  http.get(apiUrl("/v1/me/grades"), ({ request }) => {
    const semester = Number(query(request).get("semester") ?? semesterGrades.semester)
    return HttpResponse.json({ ...semesterGrades, semester })
  }),
  http.get(apiUrl("/v1/me/grades/day"), ({ request }) => {
    const date = query(request).get("date") ?? dayGrades.date
    return HttpResponse.json(date === dayGrades.date ? dayGrades : { date, lessons: [], unmatched: [] })
  }),
  http.get(apiUrl("/v1/me/record-book"), () => HttpResponse.json(recordBook)),
  http.get(apiUrl("/v1/admin/sync/runs"), ({ request }) => HttpResponse.json(paginate(syncRuns, request))),
  http.post(apiUrl("/v1/admin/sync/run"), () => accepted()),
]
