/** WEB-18–20, UF-WEB-13: homework lists, ticking and notes. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, homeworkEnglish, homeworkMath, homeworkOverdue, homeworkPhysics, server } from "@ihsp/test-utils"
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
      const item = [homeworkMath, homeworkOverdue].find((candidate) => candidate.lesson_id === params.lessonId)
      return HttpResponse.json({
        ...item,
        done_at: body.done ? "2026-10-07T05:12:00Z" : null,
        days_overdue: body.done ? 0 : (item?.days_overdue ?? 0),
      })
    }),
  )
  return seen
}

describe("Homework page", () => {
  test("Upcoming shows the homework due next study day with subject, task, teacher and dates", async () => {
    renderSp(<HomeworkPage />, { route: "/homework/" })

    const item = (await screen.findByText(homeworkMath.text)).closest("li") as HTMLElement

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
    expect(screen.queryByText(homeworkMath.text)).not.toBeInTheDocument()
  })

  test("the Overdue group comes first, is highlighted and says how many days overdue", async () => {
    renderSp(<HomeworkPage />, { route: "/homework/" })

    const overdue = await screen.findByTestId("homework-overdue")

    expect(within(overdue).getByRole("heading", { name: "Overdue" })).toBeInTheDocument()
    expect(within(overdue).getByText(homeworkOverdue.text)).toBeInTheDocument()
    expect(within(overdue).getByText("1 day overdue")).toBeInTheDocument()
    expect(within(overdue).getByTestId("homework-item")).toHaveAttribute("data-overdue", "true")
    expect(overdue.className).toContain("border-destructive")
    const tabs = await screen.findByRole("tablist")
    expect(overdue.compareDocumentPosition(tabs) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getAllByText(homeworkOverdue.text)).toHaveLength(1)
  })

  test("ticking an overdue item calls putHomeworkDone and clears the Overdue group", async () => {
    const seen = recordDone()
    const { user } = renderSp(<HomeworkPage />, { route: "/homework/" })

    const overdue = await screen.findByTestId("homework-overdue")
    await user.click(within(overdue).getByRole("checkbox", { name: "Done: Physics" }))

    await waitFor(() => expect(seen.bodies).toEqual([{ done: true }]))
    expect(seen.lessons).toEqual([homeworkOverdue.lesson_id])
    await waitFor(() => expect(screen.queryByTestId("homework-overdue")).not.toBeInTheDocument())
  })

  test("without overdue homework there is no Overdue group", async () => {
    server.use(
      http.get(apiUrl("/v1/me/homework"), ({ request }) =>
        HttpResponse.json(new URL(request.url).searchParams.get("status") === "overdue" ? [] : [homeworkMath]),
      ),
    )
    renderSp(<HomeworkPage />, { route: "/homework/" })

    await screen.findByText(homeworkMath.text)

    expect(screen.queryByTestId("homework-overdue")).not.toBeInTheDocument()
  })

  test("a failed Overdue request is shown, not hidden", async () => {
    server.use(
      http.get(apiUrl("/v1/me/homework"), ({ request }) =>
        new URL(request.url).searchParams.get("status") === "overdue"
          ? HttpResponse.json({ type: "common/internal", title: "x", status: 500 }, { status: 500 })
          : HttpResponse.json([homeworkMath]),
      ),
    )
    renderSp(<HomeworkPage />, { route: "/homework/" })

    const overdue = await screen.findByTestId("homework-overdue")

    expect(await within(overdue).findByRole("button", { name: "Try again" })).toBeInTheDocument()
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

    const item = (await screen.findByText(homeworkMath.text)).closest("li") as HTMLElement
    await user.click(within(item).getByRole("button", { name: "Add note" }))
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
  const overdue = [homeworkOverdue]
  const upcoming = [homeworkMath]
  const later = [homeworkPhysics]
  const done = [homeworkEnglish]

  function seeded(): QueryClient {
    const client = new QueryClient()
    client.setQueryData(keys.me.homework({ status: "overdue" }), overdue)
    client.setQueryData(keys.me.homework({ status: "upcoming" }), upcoming)
    client.setQueryData(keys.me.homework({ status: "later" }), later)
    client.setQueryData(keys.me.homework({ status: "done" }), done)
    client.setQueryData<StudentToday>(keys.me.today(), {
      now_or_next: null,
      lessons: [],
      next_study_day: "2026-10-08",
      due: [homeworkOverdue, homeworkMath],
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
    const due = client.getQueryData<StudentToday>(keys.me.today())?.due
    expect(due?.find((item) => item.lesson_id === homeworkMath.lesson_id)?.done_at).toBe("2026-10-07T05:00:00Z")
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

  test("a ticked overdue item leaves Overdue and enters Done", () => {
    const client = seeded()
    const ticked: HomeworkItem = { ...homeworkOverdue, done_at: "2026-10-07T05:00:00Z", days_overdue: 0 }

    applyHomeworkUpdate(client, ticked)

    expect(client.getQueryData<HomeworkItem[]>(keys.me.homework({ status: "overdue" }))).toEqual([])
    expect(
      client.getQueryData<HomeworkItem[]>(keys.me.homework({ status: "done" }))?.map((item) => item.lesson_id),
    ).toContain(homeworkOverdue.lesson_id)
    expect(client.getQueryData<StudentToday>(keys.me.today())?.due[0]?.done_at).toBe("2026-10-07T05:00:00Z")
  })

  test("an unticked item that is past due goes back to Overdue, not Upcoming", () => {
    const client = seeded()
    client.setQueryData(keys.me.homework({ status: "overdue" }), [])
    client.setQueryData(keys.me.homework({ status: "done" }), [
      { ...homeworkOverdue, done_at: "2026-10-07T05:00:00Z", days_overdue: 0 },
    ])

    applyHomeworkUpdate(client, homeworkOverdue)

    expect(
      client.getQueryData<HomeworkItem[]>(keys.me.homework({ status: "overdue" }))?.map((item) => item.lesson_id),
    ).toEqual([homeworkOverdue.lesson_id])
    expect(client.getQueryData<HomeworkItem[]>(keys.me.homework({ status: "done" }))).toEqual([])
    expect(
      client.getQueryData<HomeworkItem[]>(keys.me.homework({ status: "upcoming" }))?.map((item) => item.lesson_id),
    ).not.toContain(homeworkOverdue.lesson_id)
  })

  test("a note keeps the item in its list", () => {
    expect(nextList(upcoming, { ...homeworkMath, note: "hard" }, "upcoming", "2026-10-08")).toEqual([
      { ...homeworkMath, note: "hard" },
    ])
  })

  test("homework past its due date belongs to Overdue, due after the next study day to Later", () => {
    expect(bucketOf(homeworkOverdue, "2026-10-08")).toBe("overdue")
    expect(bucketOf(homeworkPhysics, "2026-10-08")).toBe("later")
    expect(bucketOf(homeworkMath, "2026-10-08")).toBe("upcoming")
    expect(bucketOf({ ...homeworkMath, due_date: null }, "2026-10-08")).toBe("later")
  })
})
