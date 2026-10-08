/** ADM-2, ADM-4, ADM-12–ADM-15, UF-ADM-01, UF-ADM-02, UF-ADM-09, UF-ADM-10, UF-ADM-13. */
import { describe, expect, test } from "bun:test"
import { adminTeacherUser, apiUrl, ids, moderationItems, server, teacherActivationUrl } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { AttendancePage } from "../features/attendance/components/attendance-page"
import { DashboardPage } from "../features/dashboard/components/dashboard-page"
import { ModerationPage } from "../features/moderation/components/moderation-page"
import { MonitoringPage } from "../features/monitoring/components/monitoring-page"
import { NewTeacherPage } from "../features/teachers/components/new-teacher-page"
import { TeacherProfilePage } from "../features/teachers/components/teacher-profile-page"
import { TeachersPage } from "../features/teachers/components/teachers-page"
import { configureTests, hrefOf, renderAdmin, setValue, waitUntil } from "./helpers"

configureTests()

describe("dashboard", () => {
  test("the tiles show today's numbers and link to the lists", async () => {
    renderAdmin(<DashboardPage />, { route: "/" })

    const teacherNeeded = await screen.findByRole("link", { name: /Lessons without a teacher/ })
    expect(hrefOf(teacherNeeded)).toBe("/lessons/?teacher_needed=true")
    expect(within(teacherNeeded).getByText("1")).toBeInTheDocument()
    expect(hrefOf(screen.getByRole("link", { name: /re-enter their EMIS password/ }))).toBe(
      "/students/?emis_status=needs_reauth",
    )
  })

  test("lists teachers without attendance, the last sync and scheduled broadcasts", async () => {
    renderAdmin(<DashboardPage />, { route: "/" })

    expect(await screen.findByRole("link", { name: "Yusupov Farrukh" })).toBeInTheDocument()
    expect(screen.getByText("Need a new EMIS password: 1")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Parents' meeting" })).toBeInTheDocument()
  })

  test("a failing request shows the error with a retry button", async () => {
    server.use(
      http.get(apiUrl("/v1/admin/dashboard"), () =>
        HttpResponse.json(
          { type: "common/forbidden", title: "No", status: 403, params: {} },
          { status: 403, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    )
    renderAdmin(<DashboardPage />, { route: "/" })

    expect(await screen.findByRole("button", { name: "Try again" })).toBeInTheDocument()
  })
})

describe("teachers", () => {
  test("lists teachers with their status", async () => {
    renderAdmin(<TeachersPage />, { route: "/teachers/" })

    const link = await screen.findByRole("link", { name: "Kalandarova Gavxar" })
    expect(hrefOf(link)).toBe(`/teachers/view/?id=${ids.teacherKalandarova}`)
    expect(screen.getByRole("link", { name: "New teacher" })).toBeInTheDocument()
  })

  test("creating a teacher shows the activation link to copy", async () => {
    let body: unknown
    server.use(
      http.get(apiUrl("/v1/admin/teachers"), () => HttpResponse.json({ items: [], next_cursor: null })),
      http.post(apiUrl("/v1/admin/teachers"), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ user: adminTeacherUser, activation_url: teacherActivationUrl })
      }),
    )
    const { user } = renderAdmin(<NewTeacherPage />, { route: "/teachers/new/" })

    setValue(screen.getByLabelText(/^Last name/), "Yuldasheva")
    setValue(screen.getByLabelText(/^First name/), "Nodira")
    setValue(screen.getByLabelText(/^Email/), "nodira@example.org")
    await user.click(screen.getByRole("button", { name: "Create account" }))

    expect(await screen.findByRole("textbox", { name: "Activation link" })).toHaveValue(teacherActivationUrl)
    expect(screen.getByText("Login: kalandarova.gavxar")).toBeInTheDocument()
    expect(body).toEqual({ last_name: "Yuldasheva", first_name: "Nodira", email: "nodira@example.org" })
  })

  test("a teacher with the same name triggers a warning that must be confirmed", async () => {
    let created = 0
    server.use(
      http.post(apiUrl("/v1/admin/teachers"), () => {
        created += 1
        return HttpResponse.json({ user: adminTeacherUser, activation_url: teacherActivationUrl })
      }),
    )
    const { user } = renderAdmin(<NewTeacherPage />, { route: "/teachers/new/" })

    setValue(screen.getByLabelText(/^Last name/), "Kalandarova")
    setValue(screen.getByLabelText(/^First name/), "Gavxar")
    setValue(screen.getByLabelText(/^Email/), "other@example.org")
    await user.click(screen.getByRole("button", { name: "Create account" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("A teacher with this name already exists.")
    expect(created).toBe(0)

    await user.click(screen.getByRole("button", { name: "Create anyway" }))
    await waitUntil(() => created === 1, "not created")
  })

  test("the profile shows curated groups and deactivating asks first", async () => {
    let deactivated = false
    server.use(
      http.post(apiUrl(`/v1/admin/teachers/${ids.teacherKalandarova}/deactivate`), () => {
        deactivated = true
        return HttpResponse.json(adminTeacherUser)
      }),
    )
    const { user } = renderAdmin(<TeacherProfilePage />, { route: `/teachers/view/?id=${ids.teacherKalandarova}` })

    expect(await screen.findByRole("heading", { name: "Kalandarova Gavxar" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "2TN2" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Deactivate" }))
    const dialog = await screen.findByRole("alertdialog")
    expect(deactivated).toBe(false)
    await user.click(within(dialog).getByRole("button", { name: "Deactivate" }))

    await waitUntil(() => deactivated, "no request")
  })
})

describe("attendance reports", () => {
  test("shows the report rows and loads the CSV from the API", async () => {
    let csvView = null as string | null
    server.use(
      http.get(apiUrl("/v1/admin/attendance.csv"), ({ request }) => {
        csvView = new URL(request.url).searchParams.get("view")
        return new HttpResponse("group,absences\n2TN2,6\n", { headers: { "Content-Type": "text/csv" } })
      }),
    )
    const originalCreate = URL.createObjectURL
    URL.createObjectURL = () => "blob:test"
    URL.revokeObjectURL = () => undefined
    try {
      const { user } = renderAdmin(<AttendancePage />, { route: "/attendance/" })

      expect(await screen.findByText("3%")).toBeInTheDocument()
      expect(screen.getByRole("columnheader", { name: "Group" })).toBeInTheDocument()

      await user.click(screen.getByRole("button", { name: "Export CSV" }))
      await waitUntil(() => csvView !== null, "no CSV request")
      expect(csvView).toBe("group")
    } finally {
      URL.createObjectURL = originalCreate
    }
  })

  test("the view switch asks for the other report", async () => {
    const views: (string | null)[] = []
    server.use(
      http.get(apiUrl("/v1/admin/attendance"), ({ request }) => {
        views.push(new URL(request.url).searchParams.get("view"))
        return HttpResponse.json({ view: "teacher", from: "2026-09-02", to: "2026-10-07", rows: [] })
      }),
    )
    const { user } = renderAdmin(<AttendancePage />, { route: "/attendance/" })
    await screen.findByText("No data for this period.")

    await user.click(screen.getByRole("button", { name: "Teachers" }))

    await waitUntil(() => views.includes("teacher"), "no request for the teacher view")
  })

  test("the missing tab lists teachers with a link to each lesson page of this console", async () => {
    renderAdmin(<AttendancePage />, { route: "/attendance/?tab=missing" })

    expect(await screen.findByRole("link", { name: "Yusupov Farrukh" })).toBeInTheDocument()
    const open = screen.getByRole("link", { name: "Open lesson" })
    expect(hrefOf(open)).toMatch(/^\/lessons\/view\/\?id=/)
    expect(open).not.toHaveAttribute("target")
  })
})

describe("moderation", () => {
  test("lists reported links; disabling needs a reason", async () => {
    let body: unknown
    const item = moderationItems[0]
    server.use(
      http.post(apiUrl("/v1/admin/links/:id/disable"), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(item)
      }),
    )
    const { user } = renderAdmin(<ModerationPage />, { route: "/moderation/" })
    expect(await screen.findByText("bad999")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Disable link bad999" }))
    const dialog = await screen.findByRole("dialog")
    const confirm = within(dialog).getByRole("button", { name: "Disable" })
    expect(confirm).toBeDisabled()
    setValue(within(dialog).getByLabelText(/^Reason/), "phishing")
    await waitUntil(() => !(confirm as HTMLButtonElement).disabled, "still disabled")
    await user.click(confirm)

    await waitUntil(() => body !== undefined, "no request")
    expect(body).toEqual({ reason: "phishing" })
  })

  test("dismissing the reports needs no reason", async () => {
    let dismissed = false
    server.use(
      http.post(apiUrl("/v1/admin/links/:id/dismiss-reports"), () => {
        dismissed = true
        return HttpResponse.json(moderationItems[0])
      }),
    )
    const { user } = renderAdmin(<ModerationPage />, { route: "/moderation/" })
    await screen.findByText("bad999")

    await user.click(screen.getByRole("button", { name: "Dismiss reports of link bad999" }))

    await waitUntil(() => dismissed, "no request")
  })

  test("a search in the URL uses the search endpoint", async () => {
    const seen: (string | null)[] = []
    server.use(
      http.get(apiUrl("/v1/admin/moderation/search"), ({ request }) => {
        seen.push(new URL(request.url).searchParams.get("q"))
        return HttpResponse.json([])
      }),
    )
    renderAdmin(<ModerationPage />, { route: "/moderation/?q=bad999" })

    expect(await screen.findByText("Nothing found.")).toBeInTheDocument()
    expect(seen).toEqual(["bad999"])
  })
})

describe("monitoring", () => {
  test("lists the sync runs and starts a manual run after confirmation", async () => {
    let run: unknown
    server.use(
      http.post(apiUrl("/v1/admin/sync/run"), async ({ request }) => {
        run = await request.json()
        return new HttpResponse(null, { status: 202 })
      }),
    )
    const { user } = renderAdmin(<MonitoringPage />, { route: "/monitoring/" })
    expect(await screen.findByText(/marks added: 17/)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Sync everyone now" }))
    const dialog = await screen.findByRole("alertdialog")
    expect(run).toBeUndefined()
    await user.click(within(dialog).getByRole("button", { name: "Start sync" }))

    await waitUntil(() => run !== undefined, "no request")
    expect(run).toEqual({})
  })

  test("the audit tab lists events and passes the filters", async () => {
    const seen: (string | null)[] = []
    server.use(
      http.get(apiUrl("/v1/admin/audit"), ({ request }) => {
        seen.push(new URL(request.url).searchParams.get("type"))
        return HttpResponse.json({ items: [], next_cursor: null })
      }),
    )
    renderAdmin(<MonitoringPage />, { route: "/monitoring/?tab=audit&type=user.blocked" })

    expect(await screen.findByText("No audit events match.")).toBeInTheDocument()
    expect(seen).toContain("user.blocked")
  })
})
