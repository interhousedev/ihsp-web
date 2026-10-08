/** WEB-18–20, UF-WEB-13: homework lists, ticking and notes. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, homeworkEnglish, homeworkMath, homeworkPhysics, server } from "@ihsp/test-utils"
import { keys, type HomeworkItem, type StudentToday } from "@ihsp/api"
import { QueryClient } from "@tanstack/react-query"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { HomeworkPage } from "../features/homework/components/homework-page"
import { applyHomeworkUpdate, bucketOf, nextList } from "../features/homework/utils/apply-homework-update"
import { configureTests, freezeTime, renderSp, setValue, unfreezeTime } from "./helpers"

configureTests()

beforeEach(freezeTime)
afterEach(unfreezeTime)

function recordDone(): { bodies: unknown[]; lessons: string[] } {
  const seen = { bodies: [] as unknown[], lessons: [] as string[] }
  server.use(
    http.put(apiUrl("/v1/me/homework/:lessonId/done"), async ({ params, request }) => {
      const body = (await request.json()) as { done: boolean }
      seen.bodies.push(body)
      seen.lessons.push(String(params.lessonId))
      return HttpResponse.json({ ...homeworkMath, done_at: body.done ? "2026-10-07T05:12:00Z" : null })
    }),
  )
  return seen
}

describe("Homework page", () => {
  test("Upcoming shows the homework due next study day with subject, task, teacher and dates", async () => {
    renderSp(<HomeworkPage />, { route: "/homework/" })

    const item = await screen.findByTestId("homework-item")

    expect(within(item).getByText("Mathematics")).toBeInTheDocument()
    expect(within(item).getByText("Exercises 5.3 (a)-(f) on page 41")).toBeInTheDocument()
    expect(within(item).getByText(/Due Thu,? 8 Oct/)).toBeInTheDocument()
    expect(within(item).getByText(/Given on Tue,? 6 Oct/)).toBeInTheDocument()
  })

  test("ticking an item calls putHomeworkDone and moves it out of Upcoming", async () => {
    const seen = recordDone()
    const { user } = renderSp(<HomeworkPage />, { route: "/homework/" })

    await user.click(await screen.findByRole("checkbox", { name: "Done: Mathematics" }))

    await waitFor(() => expect(seen.bodies).toEqual([{ done: true }]))
    expect(seen.lessons).toEqual([homeworkMath.lesson_id])
    expect(await screen.findByText("Nothing due. Nice.")).toBeInTheDocument()
    expect(screen.queryByTestId("homework-item")).not.toBeInTheDocument()
  })

  test("the Later tab lists the rest and marks items the teacher updated", async () => {
    const { user } = renderSp(<HomeworkPage />, { route: "/homework/?tab=later" })

    expect(await screen.findByText(homeworkPhysics.text)).toBeInTheDocument()
    expect(screen.getByText("Updated")).toBeInTheDocument()
    expect(screen.queryByText(homeworkMath.text)).not.toBeInTheDocument()
    expect(user).toBeDefined()
  })

  test("the Done tab lists ticked items with their notes", async () => {
    renderSp(<HomeworkPage />, { route: "/homework/?tab=done" })

    expect(await screen.findByText(homeworkEnglish.text)).toBeInTheDocument()
    expect(screen.getByText("Draft is in my notebook")).toBeInTheDocument()
  })

  test("a note is saved with its text and limited to 1000 characters", async () => {
    const bodies: unknown[] = []
    server.use(
      http.put(apiUrl("/v1/me/homework/:lessonId/note"), async ({ request }) => {
        const body = (await request.json()) as { note: string | null }
        bodies.push(body)
        return HttpResponse.json({ ...homeworkMath, note: body.note })
      }),
    )
    const { user } = renderSp(<HomeworkPage />, { route: "/homework/" })

    await user.click(await screen.findByRole("button", { name: "Add note" }))
    const field = screen.getByLabelText("Private note")
    expect(field).toHaveAttribute("maxlength", "1000")
    setValue(field, "pages 34-36 are hard")
    expect(screen.getByText("20/1000")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(bodies).toEqual([{ note: "pages 34-36 are hard" }]))
    expect(await screen.findByText("pages 34-36 are hard")).toBeInTheDocument()
  })

  test("saving an empty note removes it", async () => {
    const bodies: unknown[] = []
    server.use(
      http.put(apiUrl("/v1/me/homework/:lessonId/note"), async ({ request }) => {
        const body = (await request.json()) as { note: string | null }
        bodies.push(body)
        return HttpResponse.json({ ...homeworkEnglish, note: body.note })
      }),
    )
    const { user } = renderSp(<HomeworkPage />, { route: "/homework/?tab=done" })

    await user.click((await screen.findAllByRole("button", { name: "Edit note" }))[0] as HTMLElement)
    setValue(screen.getByLabelText("Private note"), "")
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(bodies).toEqual([{ note: null }]))
  })

  test("an empty list shows a friendly message", async () => {
    server.use(http.get(apiUrl("/v1/me/homework"), () => HttpResponse.json([])))
    renderSp(<HomeworkPage />, { route: "/homework/?tab=done" })

    expect(await screen.findByText("No finished homework yet.")).toBeInTheDocument()
  })
})

describe("applyHomeworkUpdate", () => {
  const upcoming = [homeworkMath]
  const later = [homeworkPhysics]
  const done = [homeworkEnglish]

  function seeded(): QueryClient {
    const client = new QueryClient()
    client.setQueryData(keys.me.homework({ status: "upcoming" }), upcoming)
    client.setQueryData(keys.me.homework({ status: "later" }), later)
    client.setQueryData(keys.me.homework({ status: "done" }), done)
    client.setQueryData<StudentToday>(keys.me.today(), {
      now_or_next: null,
      lessons: [],
      next_study_day: "2026-10-08",
      due: [homeworkMath],
      new_marks: [],
      semester: { semester: 4, gpa: null, gpa_change: null, absences: 0 },
      synced_at: null,
    })
    return client
  }

  test("a ticked item leaves Upcoming and enters Done (newest first) and the Today card", () => {
    const client = seeded()
    const ticked: HomeworkItem = { ...homeworkMath, done_at: "2026-10-07T05:00:00Z" }

    applyHomeworkUpdate(client, ticked)

    expect(client.getQueryData<HomeworkItem[]>(keys.me.homework({ status: "upcoming" }))).toEqual([])
    expect(
      client.getQueryData<HomeworkItem[]>(keys.me.homework({ status: "done" }))?.map((item) => item.lesson_id),
    ).toEqual([homeworkMath.lesson_id, homeworkEnglish.lesson_id])
    expect(client.getQueryData<StudentToday>(keys.me.today())?.due[0]?.done_at).toBe("2026-10-07T05:00:00Z")
  })

  test("an unticked item goes back to Upcoming or Later by its due date", () => {
    const client = seeded()
    const unticked: HomeworkItem = { ...homeworkEnglish, done_at: null }

    applyHomeworkUpdate(client, unticked)

    expect(client.getQueryData<HomeworkItem[]>(keys.me.homework({ status: "done" }))).toEqual([])
    expect(
      client.getQueryData<HomeworkItem[]>(keys.me.homework({ status: "upcoming" }))?.map((item) => item.lesson_id),
    ).toContain(homeworkEnglish.lesson_id)
  })

  test("a note keeps the item in its list", () => {
    expect(nextList(upcoming, { ...homeworkMath, note: "hard" }, "upcoming", "2026-10-08")).toEqual([
      { ...homeworkMath, note: "hard" },
    ])
  })

  test("homework due after the next study day belongs to Later", () => {
    expect(bucketOf(homeworkPhysics, "2026-10-08")).toBe("later")
    expect(bucketOf(homeworkMath, "2026-10-08")).toBe("upcoming")
    expect(bucketOf({ ...homeworkMath, due_date: null }, "2026-10-08")).toBe("later")
  })
})
