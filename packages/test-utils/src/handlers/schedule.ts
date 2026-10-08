import type {
  ExtraLessonInput,
  GroupCreateBody,
  GroupDetail,
  GroupPatchBody,
  LessonItem,
  LessonPatchBody,
  PersonRef,
  RoomMergeBody,
  RoomRenameBody,
  SubgroupAssignmentsBody,
  SubjectCreateBody,
  SubjectPatchBody,
  Term,
  TermInput,
  TermPatch,
  TimetableEntry,
  TimetableEntryInput,
  TimetablePatchBody,
} from "@ihsp/api"
import { HttpResponse, http } from "msw"
import {
  adminLessons,
  currentTerm,
  group2TN2,
  groupDetail1TN1,
  groupDetail2TN2,
  groups,
  importConfirmResult,
  importPreview,
  rooms,
  studentItems,
  studentProfile,
  subjects,
  terms,
  timetableConflicts,
  timetableEntries,
} from "../fixtures/schedule"
import { atTashkent, audienceOf, bellOf, ids, persons, roomRefs, subjectRefs } from "../fixtures/world"
import { apiUrl, matches, nextId, noContent, notFound, paginate, param, problem, query, readJson } from "./utils"

function personById(id: string | null | undefined): PersonRef | null {
  if (!id) return null
  return Object.values(persons).find((person) => person.id === id) ?? null
}

function groupDetailFor(id: string): GroupDetail | undefined {
  if (id === ids.group2TN2) return groupDetail2TN2
  if (id === ids.group1TN1) return groupDetail1TN1
  return undefined
}

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function roomFor(name: string | null | undefined): TimetableEntry["room"] {
  if (!name) return null
  const known = Object.values(roomRefs).find((room) => room.name.toLowerCase() === name.trim().toLowerCase())
  return known ?? { id: nextId(4), slug: slugify(name), name: name.trim() }
}

function audienceFor(audience: TimetableEntryInput["audience"]): TimetableEntry["audience"] {
  return audience.map((item) => ({
    ...audienceOf(item.subgroup),
    group_id: item.group_id,
    group_name: item.group_id === ids.group1TN1 ? "1TN1" : "2TN2",
  }))
}

function subjectRefFor(id: string | undefined) {
  return Object.values(subjectRefs).find((subject) => subject.id === id) ?? subjectRefs.math
}

function entryFromInput(input: Partial<TimetableEntryInput>, id: string): TimetableEntry {
  return {
    id,
    term_id: input.term_id ?? ids.term,
    weekday: input.weekday ?? 1,
    period: input.period ?? 1,
    week_parity: input.week_parity ?? "every",
    subject: subjectRefFor(input.subject_id),
    teacher: personById(input.teacher_id),
    room: roomFor(input.room_name),
    audience: audienceFor(input.audience ?? []),
    valid_from: input.valid_from ?? "2026-09-02",
    valid_to: input.valid_to ?? null,
  }
}

/** Monday period 1 is taken by Rakhimov T. (Mathematics), so entering him there again is a teacher conflict. */
function conflictsFor(input: Partial<TimetableEntryInput>) {
  const clash = input.teacher_id === ids.teacherRakhimov && input.weekday === 1 && input.period === 1
  return clash ? timetableConflicts : []
}

function lessonFromInput(input: Partial<ExtraLessonInput>): LessonItem {
  const date = input.date ?? "2026-10-12"
  const period = input.period ?? 1
  const bell = bellOf(period)
  return {
    id: nextId(5),
    date,
    period,
    starts_at: atTashkent(date, bell.start),
    ends_at: atTashkent(date, bell.end),
    subject: subjectRefFor(input.subject_id),
    teacher: personById(input.teacher_id),
    room: roomFor(input.room_name),
    audience: audienceFor(input.audience ?? []),
    status: "scheduled",
    is_overridden: true,
    changes: null,
    topic: input.topic ?? null,
    has_homework: false,
    attendance_submitted: false,
  }
}

function inRange(date: string, from: string | null, to: string | null): boolean {
  return (!from || date >= from) && (!to || date <= to)
}

export const scheduleHandlers = [
  // --- Terms ---
  http.get(apiUrl("/v1/admin/terms"), () => HttpResponse.json(terms)),
  http.post(apiUrl("/v1/admin/terms"), async ({ request }) => {
    const body = await readJson<TermInput>(request)
    const term: Term = { ...currentTerm, ...body, id: nextId(6), is_current: false }
    return HttpResponse.json(term)
  }),
  http.patch(apiUrl("/v1/admin/terms/:id"), async ({ params, request }) => {
    const term = terms.find((item) => item.id === param(params, "id"))
    if (!term) return notFound("Term")
    return HttpResponse.json({ ...term, ...(await readJson<TermPatch>(request)) })
  }),

  // --- Groups ---
  http.get(apiUrl("/v1/admin/groups"), ({ request }) => {
    const status = query(request).get("status")
    return HttpResponse.json(groups.filter((group) => !status || group.status === status))
  }),
  http.post(apiUrl("/v1/admin/groups"), async ({ request }) => {
    const body = await readJson<GroupCreateBody>(request)
    const name = body.name ?? "NEW1"
    return HttpResponse.json({
      ...groupDetail1TN1,
      id: nextId(2),
      name,
      slug: slugify(name),
      current_semester: body.current_semester ?? null,
      emis_group_id: body.emis_group_id ?? null,
    })
  }),
  http.get(apiUrl("/v1/admin/groups/:id"), ({ params }) => {
    const group = groupDetailFor(param(params, "id"))
    return group ? HttpResponse.json(group) : notFound("Group")
  }),
  http.patch(apiUrl("/v1/admin/groups/:id"), async ({ params, request }) => {
    const group = groupDetailFor(param(params, "id"))
    if (!group) return notFound("Group")
    const body = await readJson<GroupPatchBody>(request)
    return HttpResponse.json({
      ...group,
      status: body.status ?? group.status,
      curator: body.curator_id === undefined ? group.curator : personById(body.curator_id),
      head_student: body.head_student_id === undefined ? group.head_student : personById(body.head_student_id),
    })
  }),
  http.put(apiUrl("/v1/admin/groups/:id/subgroups"), async ({ params, request }) => {
    const group = groupDetailFor(param(params, "id"))
    if (!group) return notFound("Group")
    return HttpResponse.json(applySubgroups(group, await readJson<SubgroupAssignmentsBody>(request)))
  }),
  http.get(apiUrl("/v1/staff/groups"), () => HttpResponse.json([group2TN2])),
  http.get(apiUrl("/v1/staff/groups/:id"), ({ params }) => {
    const group = groupDetailFor(param(params, "id"))
    return group && group.id === ids.group2TN2 ? HttpResponse.json(group) : notFound("Group")
  }),
  http.put(apiUrl("/v1/staff/groups/:id/subgroups"), async ({ params, request }) => {
    const group = groupDetailFor(param(params, "id"))
    if (!group || group.id !== ids.group2TN2) return notFound("Group")
    return HttpResponse.json(applySubgroups(group, await readJson<SubgroupAssignmentsBody>(request)))
  }),

  // --- Subjects ---
  http.get(apiUrl("/v1/admin/subjects"), ({ request }) => {
    const needle = query(request).get("query")
    return HttpResponse.json(
      subjects.filter(
        (subject) =>
          matches(subject.name.en, needle) || matches(subject.name.ru, needle) || matches(subject.name.uz, needle),
      ),
    )
  }),
  http.post(apiUrl("/v1/admin/subjects"), async ({ request }) => {
    const body = await readJson<SubjectCreateBody>(request)
    return HttpResponse.json({
      id: nextId(3),
      name: body.name ?? { uz: "", ru: "", en: "" },
      short_name: body.short_name ?? null,
      emis_subject_id: body.emis_subject_id ?? null,
      can_be_divided: body.can_be_divided ?? false,
    })
  }),
  http.patch(apiUrl("/v1/admin/subjects/:id"), async ({ params, request }) => {
    const subject = subjects.find((item) => item.id === param(params, "id"))
    if (!subject) return notFound("Subject")
    const body = await readJson<SubjectPatchBody>(request)
    return HttpResponse.json({
      ...subject,
      ...body,
      name: { ...subject.name, ...body.name },
      short_name: body.short_name ?? subject.short_name,
    })
  }),

  // --- Rooms ---
  http.get(apiUrl("/v1/admin/rooms"), ({ request }) => {
    const status = query(request).get("status")
    return HttpResponse.json(rooms.filter((room) => !status || room.status === status))
  }),
  http.patch(apiUrl("/v1/admin/rooms/:id"), async ({ params, request }) => {
    const room = rooms.find((item) => item.id === param(params, "id"))
    if (!room) return notFound("Room")
    const body = await readJson<RoomRenameBody>(request)
    return HttpResponse.json({ ...room, name: body.name ?? room.name })
  }),
  http.post(apiUrl("/v1/admin/rooms/:id/regenerate-pin"), ({ params }) => {
    const room = rooms.find((item) => item.id === param(params, "id"))
    if (!room) return notFound("Room")
    return HttpResponse.json({ ...room, pin: "9027", url: room.url.replace(room.pin, "9027") })
  }),
  http.post(apiUrl("/v1/admin/rooms/:id/merge"), async ({ params, request }) => {
    const body = await readJson<RoomMergeBody>(request)
    const target = rooms.find((item) => item.id === body.into_room_id)
    if (!rooms.some((item) => item.id === param(params, "id")) || !target) return notFound("Room")
    return HttpResponse.json(target)
  }),
  http.post(apiUrl("/v1/admin/rooms/:id/archive"), ({ params }) => {
    const room = rooms.find((item) => item.id === param(params, "id"))
    if (!room) return notFound("Room")
    return HttpResponse.json({ ...room, status: "archived" })
  }),

  // --- Timetable. A teacher conflict is reported for Rakhimov T. on Monday period 1. ---
  http.get(apiUrl("/v1/admin/timetable"), ({ request }) => {
    const search = query(request)
    const groupId = search.get("group_id")
    const teacherId = search.get("teacher_id")
    const roomId = search.get("room_id")
    return HttpResponse.json(
      timetableEntries.filter(
        (entry) =>
          (!groupId || entry.audience.some((item) => item.group_id === groupId)) &&
          (!teacherId || entry.teacher?.id === teacherId) &&
          (!roomId || entry.room?.id === roomId),
      ),
    )
  }),
  http.post(apiUrl("/v1/admin/timetable/check"), async ({ request }) =>
    HttpResponse.json({ conflicts: conflictsFor(await readJson<TimetableEntryInput>(request)) }),
  ),
  http.post(apiUrl("/v1/admin/timetable/copy"), () => HttpResponse.json({ created: timetableEntries.length })),
  http.post(apiUrl("/v1/admin/timetable"), async ({ request }) => {
    const body = await readJson<TimetableEntryInput>(request)
    const conflicts = conflictsFor(body)
    if (conflicts.length > 0) {
      return problem(409, "common/conflict", "The timetable entry conflicts with another one", {
        params: { conflicts },
      })
    }
    return HttpResponse.json(entryFromInput(body, nextId(7)))
  }),
  http.patch(apiUrl("/v1/admin/timetable/:id"), async ({ params, request }) => {
    const entry = timetableEntries.find((item) => item.id === param(params, "id"))
    if (!entry) return notFound("Timetable entry")
    const body = await readJson<TimetablePatchBody>(request)
    return HttpResponse.json({
      ...entry,
      weekday: body.weekday ?? entry.weekday,
      period: body.period ?? entry.period,
      week_parity: body.week_parity ?? entry.week_parity,
      subject: body.subject_id ? subjectRefFor(body.subject_id) : entry.subject,
      teacher: body.teacher_id === undefined ? entry.teacher : personById(body.teacher_id),
      room: body.room_name === undefined ? entry.room : roomFor(body.room_name),
      audience: body.audience ? audienceFor(body.audience) : entry.audience,
      valid_from: body.valid_from ?? entry.valid_from,
      valid_to: body.valid_to === undefined ? entry.valid_to : body.valid_to,
    })
  }),
  http.delete(apiUrl("/v1/admin/timetable/:id"), () => noContent()),

  // --- Lessons ---
  http.get(apiUrl("/v1/admin/lessons"), ({ request }) => {
    const search = query(request)
    const groupId = search.get("group_id")
    const teacherId = search.get("teacher_id")
    const roomId = search.get("room_id")
    const status = search.get("status")
    const teacherNeeded = search.get("teacher_needed") === "true"
    const lessons = adminLessons.filter(
      (lesson) =>
        inRange(lesson.date, search.get("from"), search.get("to")) &&
        (!groupId || lesson.audience.some((item) => item.group_id === groupId)) &&
        (!teacherId || lesson.teacher?.id === teacherId) &&
        (!roomId || lesson.room?.id === roomId) &&
        (!status || lesson.status === status) &&
        (!teacherNeeded || lesson.teacher === null),
    )
    return HttpResponse.json(paginate(lessons, request))
  }),
  http.post(apiUrl("/v1/admin/lessons"), async ({ request }) =>
    HttpResponse.json(lessonFromInput(await readJson<ExtraLessonInput>(request))),
  ),
  http.patch(apiUrl("/v1/admin/lessons/:id"), async ({ params, request }) => {
    const lesson = adminLessons.find((item) => item.id === param(params, "id"))
    if (!lesson) return notFound("Lesson")
    const body = await readJson<LessonPatchBody>(request)
    const date = body.date ?? lesson.date
    const period = body.period ?? lesson.period
    const bell = bellOf(period)
    return HttpResponse.json({
      ...lesson,
      status: body.status ?? lesson.status,
      teacher: body.teacher_id === undefined ? lesson.teacher : personById(body.teacher_id),
      subject: body.subject_id ? subjectRefFor(body.subject_id) : lesson.subject,
      room: body.room_name === undefined ? lesson.room : roomFor(body.room_name),
      date,
      period,
      starts_at: atTashkent(date, bell.start),
      ends_at: atTashkent(date, bell.end),
      topic: body.topic === undefined ? lesson.topic : body.topic,
      is_overridden: true,
    })
  }),

  // --- Students ---
  http.get(apiUrl("/v1/admin/students"), ({ request }) => {
    const search = query(request)
    const needle = search.get("query")
    const groupId = search.get("group_id")
    const subgroup = search.get("subgroup")
    const status = search.get("status")
    const registered = search.get("registered")
    const items = studentItems.filter(
      (student) =>
        (matches(`${student.first_name} ${student.last_name}`, needle) || matches(student.login, needle)) &&
        (!groupId || student.group?.id === groupId) &&
        (!subgroup || String(student.subgroup) === subgroup) &&
        (!status || student.status === status) &&
        (!registered || String(student.registered) === registered),
    )
    return HttpResponse.json(paginate(items, request))
  }),
  http.post(apiUrl("/v1/admin/students/import"), () => HttpResponse.json(importPreview)),
  http.post(apiUrl("/v1/admin/students/import/:importId/confirm"), ({ params }) =>
    param(params, "importId") === importPreview.import_id ? HttpResponse.json(importConfirmResult) : notFound("Import"),
  ),

  // --- Own profile and timetables ---
  http.get(apiUrl("/v1/me/profile"), () => HttpResponse.json(studentProfile)),
  // The demo student is in subgroup 1, so lessons of subgroup 2 are not shown.
  http.get(apiUrl("/v1/me/timetable"), ({ request }) => {
    const search = query(request)
    return HttpResponse.json(
      adminLessons.filter(
        (lesson) =>
          lesson.teacher !== null &&
          lesson.audience.every((item) => item.subgroup !== 2) &&
          inRange(lesson.date, search.get("from"), search.get("to")),
      ),
    )
  }),
  http.get(apiUrl("/v1/staff/timetable"), ({ request }) => {
    const search = query(request)
    return HttpResponse.json(
      adminLessons.filter(
        (lesson) =>
          lesson.teacher?.id === ids.teacherKalandarova && inRange(lesson.date, search.get("from"), search.get("to")),
      ),
    )
  }),
]

function applySubgroups(group: GroupDetail, body: Partial<SubgroupAssignmentsBody>): GroupDetail {
  const assignments = body.assignments ?? []
  const students = group.students.map((student) => {
    const assignment = assignments.find((item) => item.user_id === student.user_id)
    return assignment ? { ...student, subgroup: assignment.subgroup } : student
  })
  return { ...group, students, subgroups_assigned: students.filter((student) => student.subgroup !== null).length }
}
