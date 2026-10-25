/** WEB-29, BOT-13, UF-WEB-17: settings, notification settings, Today cards. */
import { afterEach, describe, expect, test } from "bun:test"
import { apiUrl, server, teacherMe, userMe } from "@ihsp/test-utils"
import {
  NotificationSettingsForm,
  ThemePreferenceSync,
  nextSubjectIds,
  parseThreshold,
  toggleInList,
} from "@ihsp/features-core"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import {
  resetServiceWorkerRegistration,
  trackServiceWorkerRegistration,
} from "../features/pwa/utils/service-worker-registration"
import { SettingsPage } from "../features/settings/components/settings-page"
import { configureTests, renderSp, setValue } from "./helpers"

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
  test("has the general, notification and calendar sections", async () => {
    renderSp(<SettingsPage />, { route: "/settings/" })

    for (const title of ["General", "Notifications", "Calendar feed"]) {
      expect((await screen.findAllByText(title)).length).toBeGreaterThan(0)
    }
  })

  test("the theme is applied and saved in the account", async () => {
    const bodies = recordPatches()
    const { user } = renderSp(
      <ThemePreferenceSync>
        <SettingsPage />
      </ThemePreferenceSync>,
      { route: "/settings/" },
    )

    await user.click(await screen.findByRole("button", { name: "Dark" }))

    await waitFor(() => expect(bodies).toEqual([{ theme: "dark" }]))
  })

  test("a student without Telegram is told where notifications go", async () => {
    renderSp(<SettingsPage />, { route: "/settings/", session: { user: { ...userMe, telegram: [] } } })

    expect(await screen.findByText(/Notifications go to Telegram/)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Link Telegram" }).getAttribute("href")).toBe(
      "http://localhost:3001/security/telegram/",
    )
  })

  test("a student with Telegram does not see the hint", async () => {
    renderSp(<SettingsPage />, { route: "/settings/" })

    await screen.findByText("Calendar feed")

    expect(screen.queryByText(/Notifications go to Telegram/)).not.toBeInTheDocument()
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

    await user.click(await screen.findByRole("checkbox", { name: "Final (FC)" }))
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

function define(target: object, name: string, value: unknown) {
  Object.defineProperty(target, name, { value, configurable: true, writable: true })
}

describe("push notifications on this device", () => {
  afterEach(() => {
    resetServiceWorkerRegistration()
    delete (window as unknown as Record<string, unknown>).PushManager
    delete (window as unknown as Record<string, unknown>).Notification
    delete (window.navigator as unknown as Record<string, unknown>).serviceWorker
  })

  test("the settings page offers the switch and explains why it cannot be used in a plain browser tab", async () => {
    renderSp(<SettingsPage />, { route: "/settings/" })

    expect(await screen.findByRole("switch", { name: "Push notifications on this device" })).toBeInTheDocument()
    expect(await screen.findByText("This browser cannot show push notifications.")).toBeInTheDocument()
  })

  test("uses the registration of the app's service worker", async () => {
    define(
      window,
      "PushManager",
      class PushManagerStub {
        readonly stub = true
      },
    )
    define(window, "Notification", { permission: "default", requestPermission: async () => "granted" })
    define(window.navigator, "serviceWorker", {})
    const registration = { pushManager: { getSubscription: async () => null } } as unknown as ServiceWorkerRegistration
    trackServiceWorkerRegistration(Promise.resolve(registration))

    renderSp(<SettingsPage />, { route: "/settings/" })

    expect(await screen.findByText(/Get your notifications on this device/)).toBeInTheDocument()
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
