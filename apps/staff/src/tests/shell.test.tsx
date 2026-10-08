/** STF-1, GEN-9: the app frame, the teacher role check, notifications and settings. */
import { describe, expect, test } from "bun:test"
import { apiUrl, notificationItems, server, userMe, userPreferences } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { NotificationsPage } from "../features/notifications/components/notifications-page"
import { SettingsPage } from "../features/settings/components/settings-page"
import { StaffShell } from "../features/shell/components/staff-shell"
import { configureTests, hrefOf, renderStaff, teacherWith } from "./helpers"

configureTests()

describe("app frame", () => {
  test("has the header with quick navigation, the notification bell and the profile menu", async () => {
    renderStaff(
      <StaffShell>
        <p>page body</p>
      </StaffShell>,
    )

    expect(await screen.findByText("page body")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Open search" })).toBeInTheDocument()
    expect(await screen.findByRole("button", { name: /^Notifications/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Account menu" })).toBeInTheDocument()
  })

  test("the sidebar follows the staff portal areas", async () => {
    renderStaff(
      <StaffShell>
        <p>page body</p>
      </StaffShell>,
    )

    await screen.findByText("page body")
    await screen.findAllByText("Subgroups")

    for (const name of [
      "Today",
      "Timetable",
      "Journal",
      "Students",
      "Subgroups",
      "Attendance",
      "Notifications",
      "Settings",
    ]) {
      expect(screen.getAllByRole("link", { name }).length).toBeGreaterThan(0)
    }
  })

  test("a student account gets the no-access screen", async () => {
    renderStaff(
      <StaffShell>
        <p>page body</p>
      </StaffShell>,
      { session: { user: userMe } },
    )

    expect(await screen.findByText("No access")).toBeInTheDocument()
    expect(screen.queryByText("page body")).not.toBeInTheDocument()
  })
})

describe("notifications page", () => {
  test("lists the notifications with the Activity and Announcements filters", async () => {
    renderStaff(<NotificationsPage />)

    expect(await screen.findByText(notificationItems[0]?.title ?? "")).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Activity" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Announcements" })).toBeInTheDocument()
  })

  test("Mark all as read calls the API", async () => {
    let called = 0
    server.use(
      http.post(apiUrl("/v1/notifications/read-all"), () => {
        called += 1
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderStaff(<NotificationsPage />)

    await screen.findByText(notificationItems[0]?.title ?? "")
    await user.click(screen.getByRole("button", { name: "Mark all as read" }))

    await waitFor(() => expect(called).toBe(1))
  })
})

describe("settings page", () => {
  test("shows the teacher's lesson settings and no student sections", async () => {
    renderStaff(<SettingsPage />)

    expect(await screen.findByText("Send lesson links before the lesson")).toBeInTheDocument()
    expect(screen.getByRole("switch", { name: "End-of-lesson prompt" })).toBeChecked()
    expect(screen.queryByText("New marks")).not.toBeInTheDocument()
    expect(screen.queryByText("Alerts")).not.toBeInTheDocument()
  })

  test("the end-of-lesson prompt is saved at once", async () => {
    const bodies: unknown[] = []
    server.use(
      http.patch(apiUrl("/v1/id/me/preferences"), async ({ request }) => {
        const body = (await request.json()) as object
        bodies.push(body)
        return HttpResponse.json({ ...userPreferences, ...body })
      }),
    )
    const { user } = renderStaff(<SettingsPage />)

    await user.click(await screen.findByRole("switch", { name: "End-of-lesson prompt" }))

    await waitFor(() => expect(bodies).toEqual([{ lessons_prompt_enabled: false }]))
  })

  test("without Telegram it says notifications arrive only on the web and links to the setup", async () => {
    renderStaff(<SettingsPage />)

    expect(await screen.findByText(/Telegram is not linked/)).toBeInTheDocument()
    const section = screen.getByText("Lesson links and prompts come through the bot.").closest("section") as HTMLElement
    expect(hrefOf(within(section).getByRole("link", { name: "Link Telegram" }))).toBe(
      "http://localhost:3001/security/telegram/",
    )
  })

  test("with Telegram it lists the linked account", async () => {
    renderStaff(<SettingsPage />, {
      session: teacherWith({
        user: {
          telegram: [
            {
              telegram_user_id: 7,
              username: "kalandarova",
              otp_delivery: true,
              blocked: false,
              linked_at: "2026-09-01T00:00:00Z",
            },
          ],
        },
      }),
    })

    expect(await screen.findByText("@kalandarova")).toBeInTheDocument()
    expect(screen.getByText("Linked")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Manage Telegram accounts" })).toBeInTheDocument()
  })
})
