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

export const marksHandlers = [
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
