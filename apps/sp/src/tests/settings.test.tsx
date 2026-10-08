/** WEB-29, BOT-13, UF-WEB-17: settings, notification settings, Today cards. */
import { describe, expect, test } from "bun:test"
import { apiUrl, server, teacherMe, userMe } from "@ihsp/test-utils"
import { NotificationSettingsForm, nextSubjectIds, parseThreshold, toggleInList } from "@ihsp/features-core"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { SettingsPage } from "../features/settings/components/settings-page"
import { configureTests, renderSp, setValue, studentWith } from "./helpers"

configureTests()

/** Records the bodies of `PATCH /v1/id/me/preferences` and answers with the merged preferences. */
function recordPatches(): Record<string, unknown>[] {
  const bodies: Record<string, unknown>[] = []
  server.use(
    http.patch(apiUrl("/v1/id/me/preferences"), async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>
      bodies.push(body)
      return HttpResponse.json({ ...userMe.preferences, ...body })
    }),
  )
  return bodies
}

describe("settings page", () => {
  test("has the general, notification, Today cards and calendar sections", async () => {
    renderSp(<SettingsPage />, { route: "/settings/" })

    for (const title of ["General", "Notifications", "Today cards", "Calendar feed"]) {
      expect(await screen.findByText(title)).toBeInTheDocument()
    }
  })

  test("the theme is applied and saved in the account", async () => {
    const bodies = recordPatches()
    const { user } = renderSp(<SettingsPage />, { route: "/settings/" })

    await user.click(await screen.findByRole("button", { name: "Dark" }))

    await waitFor(() => expect(bodies).toEqual([{ theme: "dark" }]))
  })

  test("hiding a Today card saves the remaining cards in order", async () => {
    const bodies = recordPatches()
    const { user } = renderSp(<SettingsPage />, { route: "/settings/" })

    await user.click(await screen.findByRole("switch", { name: "Show card: Alerts" }))

    await waitFor(() =>
      expect(bodies).toEqual([{ today_cards: ["now", "timeline", "due", "marks", "semester", "announcements"] }]),
    )
  })

  test("moving a Today card up changes the saved order", async () => {
    const bodies = recordPatches()
    const { user } = renderSp(<SettingsPage />, { route: "/settings/" })

    await user.click(await screen.findByRole("button", { name: "Move up: Today's lessons" }))

    await waitFor(() =>
      expect(bodies).toEqual([
        { today_cards: ["timeline", "now", "due", "marks", "semester", "announcements", "alerts"] },
      ]),
    )
  })

  test("a hidden card can be shown again at the end", async () => {
    const bodies = recordPatches()
    const { user } = renderSp(<SettingsPage />, {
      route: "/settings/",
      session: studentWith({ today_cards: ["now", "due"] }),
    })

    await user.click(await screen.findByRole("switch", { name: "Show card: Alerts" }))

    await waitFor(() => expect(bodies).toEqual([{ today_cards: ["now", "due", "alerts"] }]))
  })

  test("the first and last visible cards cannot move beyond the ends", async () => {
    renderSp(<SettingsPage />, { route: "/settings/" })

    expect(await screen.findByRole("button", { name: "Move up: Now / Next lesson" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Move down: Alerts" })).toBeDisabled()
  })

  test("a student without Telegram is told where notifications go", async () => {
    renderSp(<SettingsPage />, { route: "/settings/", session: { user: { ...userMe, telegram: [] } } })

    expect(await screen.findByText(/Notifications are sent to Telegram/)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Link Telegram" }).getAttribute("href")).toBe(
      "http://localhost:3001/security/telegram/",
    )
  })

  test("a student with Telegram does not see the hint", async () => {
    renderSp(<SettingsPage />, { route: "/settings/" })

    await screen.findByText("Calendar feed")

    expect(screen.queryByText(/Notifications are sent to Telegram/)).not.toBeInTheDocument()
  })

  test("the calendar feed is created on demand", async () => {
    const { user } = renderSp(<SettingsPage />, { route: "/settings/" })

    await user.click(await screen.findByRole("button", { name: "Create link" }))

    expect(await screen.findByLabelText("Calendar feed link")).toHaveValue("http://localhost:8000/ical/cal-token-1.ics")
  })
})

describe("NotificationSettingsForm", () => {
  test("a student gets marks, alerts and mail settings; head students also get lesson links", async () => {
    renderSp(<NotificationSettingsForm roles={["student"]} isHeadStudent />, {})

    expect(await screen.findByText("New marks")).toBeInTheDocument()
    expect(screen.getByText("Alerts")).toBeInTheDocument()
    expect(screen.getByText("Mail")).toBeInTheDocument()
    expect(screen.getByLabelText("Send lesson links before the lesson")).toBeInTheDocument()
    expect(screen.queryByText("End-of-lesson prompt")).not.toBeInTheDocument()
  })

  test("a teacher gets the lesson settings including the end-of-lesson prompt, but no marks", () => {
    renderSp(<NotificationSettingsForm roles={["teacher"]} />, { session: { user: teacherMe } })

    expect(screen.getByText("End-of-lesson prompt")).toBeInTheDocument()
    expect(screen.queryByText("New marks")).not.toBeInTheDocument()
  })

  test("switching new-mark notifications off is saved at once", async () => {
    const bodies = recordPatches()
    const { user } = renderSp(<NotificationSettingsForm roles={["student"]} />)

    await user.click(await screen.findByRole("switch", { name: "Notify me about new marks" }))

    await waitFor(() => expect(bodies).toEqual([{ marks_enabled: false }]))
    expect(await screen.findByText("Saved")).toBeInTheDocument()
  })

  test("unticking a mark type and a mark value saves the remaining ones", async () => {
    const bodies = recordPatches()
    const { user } = renderSp(<NotificationSettingsForm roles={["student"]} />)

    await user.click(await screen.findByRole("checkbox", { name: "Final" }))
    await waitFor(() => expect(bodies).toEqual([{ marks_types: ["lesson", "midterm"] }]))
    await user.click(screen.getByRole("checkbox", { name: "2" }))

    await waitFor(() => expect(bodies.at(-1)).toEqual({ marks_values: [3, 4, 5] }))
  })

  test("unticking a subject switches from all subjects to the others", async () => {
    const bodies = recordPatches()
    const { user } = renderSp(<NotificationSettingsForm roles={["student"]} />)

    await user.click(await screen.findByRole("checkbox", { name: "Chemistry" }))

    await waitFor(() => expect(bodies).toHaveLength(1))
    const ids = (bodies[0] as { marks_subject_ids: string[] }).marks_subject_ids
    expect(ids).toHaveLength(5)
  })

  test("a threshold is off until switched on, then takes a value", async () => {
    const bodies = recordPatches()
    const { user } = renderSp(<NotificationSettingsForm roles={["student"]} />)

    await user.click(await screen.findByRole("switch", { name: "GPA below" }))
    await waitFor(() => expect(bodies).toEqual([{ alerts_gpa_below: 3.5 }]))

    const field = await screen.findByRole("spinbutton", { name: "GPA below" })
    setValue(field, "4")
    field.focus()
    field.blur()

    await waitFor(() => expect(bodies.at(-1)).toEqual({ alerts_gpa_below: 4 }))
  })

  test("a failed save shows the error and keeps the previous value", async () => {
    server.use(
      http.patch(apiUrl("/v1/id/me/preferences"), () =>
        HttpResponse.json({ type: "common/rate-limited", title: "x", status: 429 }, { status: 429 }),
      ),
    )
    const { user } = renderSp(<NotificationSettingsForm roles={["student"]} />)

    const toggle = await screen.findByRole("switch", { name: "Notify me about new marks" })
    await user.click(toggle)

    expect(await screen.findByText("Too many requests. Wait a little and try again.")).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole("switch", { name: "Notify me about new marks" })).toBeChecked())
  })
})

describe("settings helpers", () => {
  test("toggleInList keeps the order of the full list", () => {
    expect(toggleInList(["lesson", "final"], "midterm", ["lesson", "midterm", "final"])).toEqual([
      "lesson",
      "midterm",
      "final",
    ])
    expect(toggleInList(["lesson", "final"], "lesson", ["lesson", "midterm", "final"])).toEqual(["final"])
  })

  test("the subject filter is null when every subject is selected", () => {
    const all = ["a", "b", "c"]
    expect(nextSubjectIds(null, all, "b")).toEqual(["a", "c"])
    expect(nextSubjectIds(["a", "c"], all, "b")).toBeNull()
    expect(nextSubjectIds(["a"], all, "a")).toEqual([])
  })

  test("thresholds outside the range or empty are refused", () => {
    expect(parseThreshold("3,5", 2, 5)).toBe(3.5)
    expect(parseThreshold("6", 2, 5)).toBeUndefined()
    expect(parseThreshold("", 2, 5)).toBeUndefined()
    expect(parseThreshold("abc", 2, 5)).toBeUndefined()
  })
})
