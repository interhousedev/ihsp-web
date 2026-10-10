/** Platform settings page, editing a user and setting an initial password (T5.3). */
import { describe, expect, test } from "bun:test"
import { adminTeacherUser, apiUrl, ids, platformSettings, server } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { SettingsPage } from "../features/settings/components/settings-page"
import { TeacherProfilePage } from "../features/teachers/components/teacher-profile-page"
import { EditUserDialog } from "../features/users/components/edit-user-dialog"
import { isStrongPassword } from "../features/users/components/set-password-dialog"
import { UserDetailPage } from "../features/users/components/user-detail-page"
import { configureTests, renderAdmin, setValue, waitUntil } from "./helpers"

configureTests()

describe("platform settings", () => {
  test("shows the saved values and the read-only feature flags", async () => {
    renderAdmin(<SettingsPage />, { route: "/settings/" })

    expect(await screen.findByLabelText("School name")).toHaveValue("")
    expect(screen.getByLabelText("Default interface language")).toHaveValue("ru")
    const notebooks = screen.getByText("Notebooks").closest("li") as HTMLElement
    expect(within(notebooks).getByText("on")).toBeInTheDocument()
    expect(within(notebooks).getByText(/AI notebooks for study materials/)).toBeInTheDocument()
    const password = screen.getByText("Password change at login").closest("li") as HTMLElement
    expect(within(password).getByText("off")).toBeInTheDocument()
    expect(document.body.textContent).not.toContain("IHSP_")
    expect(document.body.textContent).not.toContain("change_password_on_login")
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled()
  })

  test("a flag without a translated name shows its key in sentence case", async () => {
    server.use(
      http.get(apiUrl("/v1/admin/settings"), () =>
        HttpResponse.json({ ...platformSettings, features: { ...platformSettings.features, brand_new_flag: true } }),
      ),
    )
    renderAdmin(<SettingsPage />, { route: "/settings/" })

    const row = (await screen.findByText("Brand new flag")).closest("li") as HTMLElement
    expect(within(row).getByText("on")).toBeInTheDocument()
  })

  test("saving sends every setting", async () => {
    let body: unknown
    server.use(
      http.put(apiUrl("/v1/admin/settings"), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ ...platformSettings, ...(body as object) })
      }),
    )
    const { user } = renderAdmin(<SettingsPage />, { route: "/settings/" })

    setValue(await screen.findByLabelText("School name"), "  IHSU  ")
    setValue(screen.getByLabelText("Support contact"), "help@example.org")
    await user.click(screen.getByRole("checkbox", { name: /change a password set by an administrator/ }))
    const save = screen.getByRole("button", { name: "Save" })
    await waitUntil(() => !(save as HTMLButtonElement).disabled, "save still disabled")
    await user.click(save)

    await waitUntil(() => body !== undefined, "no request")
    expect(body).toEqual({
      school_name: "IHSU",
      support_contact: "help@example.org",
      change_password_on_login: true,
      default_language: "ru",
    })
  })
})

describe("edit a user", () => {
  test("sends only the changed fields", async () => {
    let body: unknown
    server.use(
      http.patch(apiUrl(`/v1/admin/users/${ids.teacherKalandarova}`), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(adminTeacherUser)
      }),
    )
    const { user } = renderAdmin(<EditUserDialog user={adminTeacherUser} open onOpenChange={() => {}} />)

    const dialog = await screen.findByRole("dialog")
    setValue(within(dialog).getByLabelText(/^First name/), "Gavhar")
    setValue(within(dialog).getByLabelText("Email"), "new@example.org")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitUntil(() => body !== undefined, "no request")
    expect(body).toEqual({ first_name: "Gavhar", email: "new@example.org" })
  })

  test("a taken email keeps the dialog open", async () => {
    let answered = false
    server.use(
      http.patch(apiUrl(`/v1/admin/users/${ids.teacherKalandarova}`), () => {
        answered = true
        return HttpResponse.json(
          { type: "id/email-taken", title: "taken", status: 409 },
          { status: 409, headers: { "Content-Type": "application/problem+json" } },
        )
      }),
    )
    const { user } = renderAdmin(<EditUserDialog user={adminTeacherUser} open onOpenChange={() => {}} />)

    const dialog = await screen.findByRole("dialog")
    setValue(within(dialog).getByLabelText("Email"), "taken@example.org")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitUntil(() => answered, "no request")
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  test("the user page offers Edit", async () => {
    renderAdmin(<UserDetailPage />, { route: `/users/view/?id=${ids.student}` })

    expect(await screen.findByRole("button", { name: "Edit" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Set password" })).toBeInTheDocument()
  })
})

describe("initial password", () => {
  test("the password policy mirrors the backend", () => {
    expect(isStrongPassword("Abcdefg1")).toBe(true)
    expect(isStrongPassword("abcdefg1")).toBe(false)
    expect(isStrongPassword("ABCDEFG1")).toBe(false)
    expect(isStrongPassword("Abcdefgh")).toBe(false)
    expect(isStrongPassword("Abc1")).toBe(false)
  })

  test("the teacher page sets the password and marks it temporary", async () => {
    let body: unknown
    server.use(
      http.post(apiUrl(`/v1/admin/users/${ids.teacherKalandarova}/set-password`), async ({ request }) => {
        body = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderAdmin(<TeacherProfilePage />, { route: `/teachers/view/?id=${ids.teacherKalandarova}` })

    await user.click(await screen.findByRole("button", { name: "Set password" }))
    const dialog = await screen.findByRole("dialog")
    const submit = within(dialog).getByRole("button", { name: "Set password" })
    expect(submit).toBeDisabled()
    setValue(within(dialog).getByLabelText(/^New password/), "Strong-Pass-1")
    await waitUntil(() => !(submit as HTMLButtonElement).disabled, "still disabled")
    await user.click(submit)

    await waitUntil(() => body !== undefined, "no request")
    expect(body).toEqual({ password: "Strong-Pass-1", require_change: true })
  })
})
