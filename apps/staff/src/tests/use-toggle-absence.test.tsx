/** useToggleAbsence: the cell changes at once, an error restores it, a success stores the version and refreshes lists. */
import { describe, expect, test } from "bun:test"
import { keys, type Journal } from "@ihsp/api"
import { apiUrl, createTestQueryClient, ids, journal, server } from "@ihsp/test-utils"
import { act, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { useEffect } from "react"
import { useToggleAbsence } from "../features/journal/hooks/use-toggle-absence"
import { configureTests, renderStaff } from "./helpers"

configureTests()

const params = { subject_id: ids.physics, audience_key: "2tn2" }
const lesson = journal.lessons[0]
const student = journal.students[0]
if (!lesson || !student) throw new Error("fixture: no lesson or student")
const change = { lessonId: lesson.id, studentId: student.user_id, absent: true }

function cell(data: Journal | undefined) {
  return data?.students.find((s) => s.user_id === student.user_id)?.cells.find((c) => c.lesson_id === lesson.id)
}

function setup() {
  const queryClient = createTestQueryClient()
  const key = keys.staff.journal.grid(params)
  queryClient.setQueryData<Journal>(key, journal)
  const invalidated: unknown[] = []
  const original = queryClient.invalidateQueries.bind(queryClient)
  queryClient.invalidateQueries = ((filters: { queryKey?: unknown }) => {
    invalidated.push(filters.queryKey)
    return original(filters as never)
  }) as typeof queryClient.invalidateQueries
  let mutation: ReturnType<typeof useToggleAbsence> | undefined
  function Probe() {
    const current = useToggleAbsence(params)
    useEffect(() => {
      mutation = current
    })
    return null
  }
  renderStaff(<Probe />, { queryClient })
  const fire = () => {
    act(() => {
      mutation?.mutate(change)
    })
  }
  return { queryClient, key, fire, invalidated }
}

describe("useToggleAbsence", () => {
  test("shows the change at once, sends base_version, stores the returned version and refreshes the lists", async () => {
    const bodies: unknown[] = []
    let release: () => void = () => undefined
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.post(apiUrl("/v1/staff/journal/toggle"), async ({ request }) => {
        bodies.push(await request.json())
        await gate
        return HttpResponse.json({ attendance_version: 9 })
      }),
    )
    const { queryClient, key, fire, invalidated } = setup()
    expect(cell(queryClient.getQueryData<Journal>(key))?.absent).toBe(false)

    fire()
    await waitFor(() => expect(cell(queryClient.getQueryData<Journal>(key))?.absent).toBe(true))
    expect(queryClient.getQueryData<Journal>(key)?.students[0]?.absences).toBe(1)
    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({
      lesson_id: lesson.id,
      student_id: student.user_id,
      absent: true,
      late: false,
      base_version: 3,
    })

    release()
    await waitFor(() =>
      expect(queryClient.getQueryData<Journal>(key)?.lessons.find((l) => l.id === lesson.id)?.version).toBe(9),
    )
    await waitFor(() => expect(invalidated).toContainEqual(keys.staff.today()))
    expect(invalidated).toContainEqual(["staff", "timetable"])
    expect(invalidated).toContainEqual(keys.staff.lesson(lesson.id))
    expect(cell(queryClient.getQueryData<Journal>(key))?.absent).toBe(true)
  })

  test("an error restores the previous grid and loads it again", async () => {
    server.use(
      http.post(apiUrl("/v1/staff/journal/toggle"), () =>
        HttpResponse.json({ type: "common/conflict", status: 409, title: "Conflict" }, { status: 409 }),
      ),
    )
    const { queryClient, key, fire, invalidated } = setup()
    fire()
    await waitFor(() => expect(invalidated).toContainEqual(key))
    expect(queryClient.getQueryData<Journal>(key)).toEqual(journal)
    expect(invalidated).not.toContainEqual(keys.staff.today())
  })
})
