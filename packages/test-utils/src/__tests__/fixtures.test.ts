import { describe, expect, test } from "bun:test"
import * as fx from "../fixtures"

/** Collects every exported value of the fixtures module (functions are helpers, not data). */
const data = Object.entries(fx).filter(([, value]) => typeof value !== "function")

describe("fixtures are plain JSON data", () => {
  test("every exported fixture survives a JSON round trip (no undefined, dates or class instances)", () => {
    expect(data.length).toBeGreaterThan(150)
    const lossy = data.filter(
      ([, value]) => JSON.stringify(JSON.parse(JSON.stringify(value))) !== JSON.stringify(value),
    )
    expect(lossy.map(([name]) => name)).toEqual([])
  })
})

describe("world", () => {
  test("ids are unique, well-formed UUIDs", () => {
    const values = Object.values(fx.ids)
    expect(new Set(values).size).toBe(values.length)
    for (const id of values) expect(id).toMatch(/^[0-9a-f]{8}-0000-4000-8000-[0-9a-f]{12}$/)
  })

  test("the fixture week runs from Monday 5 to Saturday 10 October 2026 and today is Wednesday", () => {
    expect(fx.FIXTURE_TODAY).toBe("2026-10-07")
    expect(new Date(`${fx.FIXTURE_WEEK_START}T00:00:00Z`).getUTCDay()).toBe(1)
    expect(new Date(`${fx.FIXTURE_TODAY}T00:00:00Z`).getUTCDay()).toBe(3)
    expect(fx.weekDates[1]).toBe("2026-10-05")
    expect(fx.weekDates[6]).toBe("2026-10-10")
  })

  test("atTashkent converts to UTC with the +05:00 offset", () => {
    expect(fx.atTashkent("2026-10-07", "08:30")).toBe("2026-10-07T03:30:00Z")
    expect(fx.atTashkent("2026-10-07", "02:00")).toBe("2026-10-06T21:00:00Z")
  })

  test("lessons have unique ids, bell times and the teacher of their subject", () => {
    const lessonIds = fx.weekLessons.map((lesson) => lesson.id)
    expect(new Set(lessonIds).size).toBe(lessonIds.length)
    for (const lesson of fx.weekLessons) {
      const bell = fx.bellOf(lesson.period)
      expect(lesson.starts_at).toBe(fx.atTashkent(lesson.date, bell.start))
      expect(lesson.ends_at).toBe(fx.atTashkent(lesson.date, bell.end))
      expect(lesson.teacher).not.toBeNull()
    }
  })

  test("today has lessons, including the physics and mathematics lessons the other fixtures refer to", () => {
    expect(fx.todayLessons.length).toBeGreaterThan(0)
    expect(fx.todayLessons.every((lesson) => lesson.date === fx.FIXTURE_TODAY)).toBe(true)
    const todayIds = fx.todayLessons.map((lesson) => lesson.id)
    expect(todayIds).toContain(fx.ids.lessonPhysicsToday)
    expect(todayIds).toContain(fx.ids.lessonMathToday)
    expect(fx.findLesson(fx.ids.lessonPhysicsToday)?.subject.id).toBe(fx.ids.physics)
  })

  test("every bell says who set it: the current term is by hand, the previous term comes from EMIS", () => {
    expect(fx.bells.every((bell) => bell.source === "manual")).toBe(true)
    expect(fx.emisBells.map((bell) => bell.period)).toEqual(fx.bells.map((bell) => bell.period))
    expect(fx.emisBells.every((bell) => bell.source === "emis")).toBe(true)
    expect(fx.currentTerm.bells.every((bell) => bell.source === "manual")).toBe(true)
    expect(fx.previousTerm.bells.every((bell) => bell.source === "emis")).toBe(true)
  })

  test("a lesson id is stable per weekday and period", () => {
    expect(fx.lessonId(3, 4)).toBe(fx.lessonId(3, 4))
    expect(fx.lessonId(3, 4)).not.toBe(fx.lessonId(3, 5))
  })
})

describe("references between fixtures resolve", () => {
  const lessonIds = new Set(fx.weekLessons.map((lesson) => lesson.id))

  test("homework belongs to lessons of the week", () => {
    for (const item of fx.homeworkItems) expect(lessonIds.has(item.lesson_id)).toBe(true)
  })

  test("every homework item is in exactly one list, and overdue items are open and late", () => {
    const lists = (["overdue", "upcoming", "later", "done"] as const).map((status) => fx.homeworkByStatus(status))
    const seen = lists.flat().map((item) => item.lesson_id)
    expect(seen.toSorted()).toEqual(fx.homeworkItems.map((item) => item.lesson_id).toSorted())
    for (const item of fx.homeworkByStatus("overdue")) {
      expect(item.done_at).toBeNull()
      expect(item.days_overdue).toBeGreaterThan(0)
    }
    expect(fx.studentToday.due.map((item) => item.lesson_id)).toEqual([
      fx.homeworkOverdue.lesson_id,
      fx.homeworkMath.lesson_id,
    ])
  })

  test("marks belong to lessons of the week and to a known subject", () => {
    const subjects = new Set(Object.values(fx.subjectRefs).map((subject) => subject.id))
    for (const mark of fx.marks) {
      expect(subjects.has(mark.subject.id)).toBe(true)
      if (mark.lesson_id) expect(lessonIds.has(mark.lesson_id)).toBe(true)
    }
  })

  test("the admin lessons include the changed lessons (cancelled, no teacher) once", () => {
    const adminIds = fx.adminLessons.map((lesson) => lesson.id)
    expect(new Set(adminIds).size).toBe(adminIds.length)
    expect(adminIds).toContain(fx.cancelledLesson.id)
    expect(adminIds).toContain(fx.teacherNeededLesson.id)
    expect(fx.adminLessons.find((lesson) => lesson.id === fx.cancelledLesson.id)?.status).toBe("cancelled")
    expect(fx.teacherNeededLesson.teacher).toBeNull()
  })

  test("the staff lesson of today has a roster of the group students", () => {
    const lesson = fx.staffLessonFor(fx.ids.lessonPhysicsToday)
    expect(lesson?.attendance.roster.length).toBeGreaterThan(0)
  })

  test("resources point to lessons of the week and share links", () => {
    for (const resource of fx.resourceItems) expect(lessonIds.has(resource.lesson_id)).toBe(true)
  })

  test("a pending file fixture is created by pendingFile with the upload target of its id", () => {
    const file = fx.pendingFile({
      id: fx.ids.file,
      name: "a.pdf",
      size: 3,
      contentType: "application/pdf",
      purpose: "link",
    })
    expect([file.status, file.byte_size, file.assistant_ready]).toEqual(["pending", 3, false])
    expect(fx.uploadTargetFor(file.id, { "Content-Type": "application/pdf" })).toEqual({
      url: `${fx.TEST_STORAGE_URL}/uploads/${file.id}`,
      method: "PUT",
      headers: { "Content-Type": "application/pdf" },
    })
  })

  test("the test environment points every app origin at localhost", () => {
    for (const [key, value] of Object.entries(fx.TEST_ENV)) {
      if (key.endsWith("_URL") || key.endsWith("_ORIGIN")) expect(String(value)).toStartWith("http://localhost")
    }
    expect(fx.TEST_ENV.APP_ENV).toBe("test")
  })
})

describe("student, teacher and admin identities", () => {
  test("each role has its own user fixture", () => {
    expect(fx.userMe.roles).toEqual(["student"])
    expect(fx.teacherMe.roles).toContain("teacher")
    expect(fx.adminMe.roles).toContain("admin")
  })

  test("the connector token is shown with its prefix as stored", () => {
    expect(fx.connectorToken.startsWith(fx.connectors[0]?.token_prefix ?? "ihsp_")).toBe(true)
  })
})
