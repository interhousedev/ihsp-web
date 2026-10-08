/** STF-2, UF-STF-01, UF-STF-02: Today. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, ids, server, staffToday, teacherMe, userPreferences } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { TodayPage } from "../features/today/components/today-page"
import { configureTests, freezeTime, hrefOf, renderStaff, unfreezeTime } from "./helpers"

configureTests()

beforeEach(freezeTime)
afterEach(unfreezeTime)

async function card(title: string | RegExp): Promise<HTMLElement> {
  const heading = await screen.findByText(title)
  const section = heading.closest("section")
  if (!section) throw new Error(`"${String(title)}" is not inside a section`)
  return section
}

describe("Today", () => {
  test("the next lesson has the Attendance, Homework and Add material quick actions", async () => {
    renderStaff(<TodayPage />)

    const next = await card("Next lesson")

    expect(within(next).getByText("Physics")).toBeInTheDocument()
    expect(within(next).getByText(/2TN2/)).toBeInTheDocument()
    const id = encodeURIComponent(ids.lessonPhysicsToday)
    expect(hrefOf(within(next).getByRole("link", { name: "Attendance" }))).toBe(`/lessons/view/?id=${id}#attendance`)
    expect(hrefOf(within(next).getByRole("link", { name: "Homework" }))).toBe(`/lessons/view/?id=${id}#homework`)
    expect(hrefOf(within(next).getByRole("link", { name: "Add material" }))).toBe(
      `/lessons/view/?id=${id}&add=material#materials`,
    )
  })

  test("today's lessons show badges for missing attendance and homework", async () => {
    const lesson = staffToday.lessons[0]
    if (!lesson) throw new Error("fixture: no lesson today")
    server.use(
      http.get(apiUrl("/v1/staff/today"), () =>
        HttpResponse.json({
          ...staffToday,
          lessons: [{ ...lesson, attendance_missing: true, homework_missing: true }],
        }),
      ),
    )
    renderStaff(<TodayPage />)

    const lessons = await card("Today's lessons")

    expect(within(lessons).getByText("Attendance missing")).toBeInTheDocument()
    expect(within(lessons).getByText("No homework yet")).toBeInTheDocument()
  })

  test("a cancelled lesson is marked and has no quick actions", async () => {
    const lesson = staffToday.lessons[0]
    if (!lesson) throw new Error("fixture: no lesson today")
    const cancelled = { ...lesson, status: "cancelled" as const }
    server.use(
      http.get(apiUrl("/v1/staff/today"), () =>
        HttpResponse.json({ ...staffToday, now_or_next: cancelled, lessons: [cancelled] }),
      ),
    )
    renderStaff(<TodayPage />)

    const next = await card("Next lesson")

    expect(within(next).getByText("Cancelled")).toBeInTheDocument()
    expect(within(next).queryByRole("link", { name: "Attendance" })).not.toBeInTheDocument()
    expect(within(await card("Today's lessons")).getByText("Cancelled")).toBeInTheDocument()
  })

  test("Needs attention lists past lessons with Take attendance", async () => {
    renderStaff(<TodayPage />)

    const attention = await card("Needs attention")

    const lesson = staffToday.needs_attention[0]
    expect(lesson).toBeDefined()
    expect(hrefOf(within(attention).getByRole("link", { name: "Take attendance" }))).toBe(
      `/lessons/view/?id=${encodeURIComponent(lesson?.id ?? "")}#attendance`,
    )
  })

  test("an empty Needs attention says everything is up to date", async () => {
    server.use(http.get(apiUrl("/v1/staff/today"), () => HttpResponse.json({ ...staffToday, needs_attention: [] })))
    renderStaff(<TodayPage />)

    expect(await screen.findByText("Attendance is up to date for the last 7 days.")).toBeInTheDocument()
  })

  test("no lesson left today", async () => {
    server.use(
      http.get(apiUrl("/v1/staff/today"), () =>
        HttpResponse.json({ now_or_next: null, lessons: [], needs_attention: [] }),
      ),
    )
    renderStaff(<TodayPage />)

    expect(await screen.findByText("No more lessons today.")).toBeInTheDocument()
    expect(screen.getByText("You have no lessons today.")).toBeInTheDocument()
  })

  test("a failed request shows an error with Try again", async () => {
    server.use(
      http.get(apiUrl("/v1/staff/today"), () =>
        HttpResponse.json({ type: "common/internal", status: 500, title: "x" }, { status: 500 }),
      ),
    )
    renderStaff(<TodayPage />)

    expect(await screen.findByRole("button", { name: "Try again" })).toBeInTheDocument()
  })
})

describe("Get started card", () => {
  test("suggests linking Telegram and checking notifications", async () => {
    renderStaff(<TodayPage />)

    const started = await card("Get started")

    expect(hrefOf(within(started).getByRole("link", { name: "Link Telegram" }))).toBe(
      "http://localhost:3001/security/telegram/",
    )
    expect(hrefOf(within(started).getByRole("link", { name: "Open settings" }))).toBe("/settings/")
  })

  test("Hide dismisses the steps in the account", async () => {
    const bodies: unknown[] = []
    server.use(
      http.patch(apiUrl("/v1/id/me/preferences"), async ({ request }) => {
        const body = (await request.json()) as object
        bodies.push(body)
        return HttpResponse.json({ ...userPreferences, ...body })
      }),
    )
    const { user } = renderStaff(<TodayPage />)

    const started = await card("Get started")
    await user.click(within(started).getByRole("button", { name: "Hide" }))

    await waitFor(() => expect(bodies).toEqual([{ onboarding_dismissed: ["telegram", "notifications"] }]))
    await waitFor(() => expect(screen.queryByText("Get started")).not.toBeInTheDocument())
  })

  test("is not shown when Telegram is linked and the steps are dismissed", async () => {
    renderStaff(<TodayPage />, {
      session: {
        user: {
          ...teacherMe,
          telegram: [
            {
              telegram_user_id: 1,
              username: "kalandarova",
              otp_delivery: false,
              blocked: false,
              linked_at: "2026-09-01T00:00:00Z",
            },
          ],
          preferences: { ...userPreferences, onboarding_dismissed: ["notifications"] },
        },
      },
    })

    await screen.findByText("Next lesson")

    expect(screen.queryByText("Get started")).not.toBeInTheDocument()
  })
})
