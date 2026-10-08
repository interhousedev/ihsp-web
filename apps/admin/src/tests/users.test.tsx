/** ADM-5, MAIL-8, UF-ADM-03, UF-ADM-11, UF-ADM-15: block, roles, resets, mail suspension, OAuth clients. */
import { describe, expect, test } from "bun:test"
import { adminAdminUser, adminStudentUser, apiUrl, ids, server } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { BlockActions } from "../features/users/components/block-actions"
import { UserDetailPage } from "../features/users/components/user-detail-page"
import { UsersPage } from "../features/users/components/users-page"
import { configureTests, renderAdmin, setValue, waitUntil } from "./helpers"

configureTests()

describe("block a user", () => {
  test("asks for a reason first and sends it", async () => {
    let body: unknown
    server.use(
      http.post(apiUrl(`/v1/admin/users/${ids.student}/block`), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ ...adminStudentUser, status: "blocked" })
      }),
    )
    const { user } = renderAdmin(<BlockActions userId={ids.student} name="Brastilov Aleksey" blocked={false} />)

    await user.click(screen.getByRole("button", { name: "Block" }))

    const dialog = await screen.findByRole("dialog")
    const confirm = within(dialog).getByRole("button", { name: "Block" })
    expect(confirm).toBeDisabled()
    expect(body).toBeUndefined()

    setValue(within(dialog).getByLabelText(/^Reason/), "  Shared the exam answers  ")
    await waitUntil(() => !(confirm as HTMLButtonElement).disabled, "block still disabled")
    await user.click(confirm)

    await waitUntil(() => body !== undefined, "no request")
    expect(body).toEqual({ reason: "Shared the exam answers" })
  })

  test("an already blocked user can be unblocked without a reason", async () => {
    let unblocked = false
    server.use(
      http.post(apiUrl(`/v1/admin/users/${ids.student}/unblock`), () => {
        unblocked = true
        return HttpResponse.json(adminStudentUser)
      }),
    )
    const { user } = renderAdmin(<BlockActions userId={ids.student} name="Brastilov Aleksey" blocked />)

    await user.click(screen.getByRole("button", { name: "Unblock" }))

    await waitUntil(() => unblocked, "no request")
  })

  test("revoking sessions asks for confirmation", async () => {
    let revoked = false
    server.use(
      http.post(apiUrl(`/v1/admin/users/${ids.student}/sessions/revoke`), () => {
        revoked = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderAdmin(<BlockActions userId={ids.student} name="Brastilov Aleksey" blocked={false} />)

    await user.click(screen.getByRole("button", { name: "Revoke sessions" }))
    const dialog = await screen.findByRole("alertdialog")
    expect(revoked).toBe(false)
    await user.click(within(dialog).getByRole("button", { name: "Revoke sessions" }))

    await waitUntil(() => revoked, "no request")
  })
})

describe("users list", () => {
  test("lists users with roles and status", async () => {
    renderAdmin(<UsersPage />, { route: "/users/" })

    expect(await screen.findByRole("link", { name: "Brastilov Aleksey Olegovich" })).toBeInTheDocument()
    expect(screen.getByText("Mail suspended")).toBeInTheDocument()
    expect(screen.getAllByText("Administration").length).toBeGreaterThan(0)
  })

  test("the OAuth clients tab verifies a client", async () => {
    let body: unknown
    server.use(
      http.post(apiUrl("/v1/admin/oauth-clients/:clientId/verify"), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({
          client_id: "mcp-client-1",
          name: "Claude Desktop",
          verified: true,
          dynamic: true,
          last_used_at: null,
        })
      }),
    )
    const { user } = renderAdmin(<UsersPage />, { route: "/users/?tab=clients" })

    expect(await screen.findByText("Claude Desktop")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Mark as verified" }))

    await waitUntil(() => body !== undefined, "no request")
    expect(body).toEqual({ verified: true })
  })
})

describe("user detail", () => {
  test("granting Administration asks for confirmation and sends the role change", async () => {
    let body: unknown
    server.use(
      http.post(apiUrl(`/v1/admin/users/${ids.student}/roles`), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ ...adminStudentUser, roles: ["student", "admin"] })
      }),
    )
    const { user } = renderAdmin(<UserDetailPage />, { route: `/users/view/?id=${ids.student}` })
    await screen.findByRole("heading", { name: "Brastilov Aleksey Olegovich" })

    const save = screen.getByRole("button", { name: "Save roles" })
    expect(save).toBeDisabled()
    await user.click(screen.getByRole("checkbox", { name: "Administration" }))
    await user.click(save)

    const dialog = await screen.findByRole("alertdialog")
    expect(within(dialog).getByText("+ Administration")).toBeInTheDocument()
    await user.click(within(dialog).getByRole("button", { name: "Save roles" }))

    await waitUntil(() => body !== undefined, "no request")
    expect(body).toEqual({ grant: ["admin"], revoke: [] })
  })

  test("resetting the password of an administrator shows the activation link once", async () => {
    server.use(
      http.get(apiUrl(`/v1/admin/users/${ids.admin}`), () =>
        HttpResponse.json({ ...adminAdminUser, telegram: [], sessions: [], recent_audit: [] }),
      ),
    )
    const { user } = renderAdmin(<UserDetailPage />, { route: `/users/view/?id=${ids.admin}` })
    await screen.findByRole("heading", { name: /Ihsp/ })

    await user.click(screen.getByRole("button", { name: "Reset password" }))
    const confirm = await screen.findByRole("alertdialog")
    await user.click(within(confirm).getByRole("button", { name: "Reset password" }))

    const link = await screen.findByRole("textbox", { name: "Activation link" })
    expect(link).toHaveValue("http://localhost:3001/activate/?token=reset-token-1")
  })

  test("suspending the mailbox needs a reason", async () => {
    let body: unknown
    server.use(
      http.post(apiUrl(`/v1/admin/users/${ids.student}/mail/suspend`), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ ...adminStudentUser, mail_suspended: true })
      }),
    )
    const { user } = renderAdmin(<UserDetailPage />, { route: `/users/view/?id=${ids.student}` })
    await screen.findByRole("heading", { name: "Brastilov Aleksey Olegovich" })

    await user.click(screen.getByRole("button", { name: "Suspend sending" }))
    const dialog = await screen.findByRole("dialog")
    const confirm = within(dialog).getByRole("button", { name: "Suspend sending" })
    expect(confirm).toBeDisabled()
    setValue(within(dialog).getByLabelText(/^Reason/), "Spam complaints")
    await waitUntil(() => !(confirm as HTMLButtonElement).disabled, "still disabled")
    await user.click(confirm)

    await waitUntil(() => body !== undefined, "no request")
    expect(body).toEqual({ reason: "Spam complaints" })
  })
})
