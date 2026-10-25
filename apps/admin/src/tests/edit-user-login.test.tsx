/** Admin edits a user's login: only a changed login is sent; a taken one is shown inline. */
import { describe, expect, test } from "bun:test"
import { adminTeacherUser, apiUrl, ids, server } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { EditUserDialog } from "../features/users/components/edit-user-dialog"
import { configureTests, renderAdmin, setValue, waitUntil } from "./helpers"

configureTests()

describe("edit a user's login", () => {
  test("sends the login only when it changed", async () => {
    let body: unknown
    server.use(
      http.patch(apiUrl(`/v1/admin/users/${ids.teacherKalandarova}`), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(adminTeacherUser)
      }),
    )
    const { user } = renderAdmin(<EditUserDialog user={adminTeacherUser} open onOpenChange={() => {}} />)

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByLabelText(/^Login/)).toHaveValue("kalandarova.gavxar")
    setValue(within(dialog).getByLabelText(/^Login/), "Kalandarova.Gavxar2")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitUntil(() => body !== undefined, "no request")
    expect(body).toEqual({ login: "kalandarova.gavxar2" })
  })

  test("a taken login shows the message and keeps the dialog open", async () => {
    let answered = false
    server.use(
      http.patch(apiUrl(`/v1/admin/users/${ids.teacherKalandarova}`), () => {
        answered = true
        return HttpResponse.json(
          { type: "id/login-taken", title: "taken", status: 409 },
          { status: 409, headers: { "Content-Type": "application/problem+json" } },
        )
      }),
    )
    const { user } = renderAdmin(<EditUserDialog user={adminTeacherUser} open onOpenChange={() => {}} />)

    const dialog = await screen.findByRole("dialog")
    setValue(within(dialog).getByLabelText(/^Login/), "aliev.bahodir")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitUntil(() => answered, "no request")
    expect(await screen.findByRole("alert")).toHaveTextContent("This login is already taken.")
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  test("an empty login cannot be saved", async () => {
    renderAdmin(<EditUserDialog user={adminTeacherUser} open onOpenChange={() => {}} />)

    const dialog = await screen.findByRole("dialog")
    setValue(within(dialog).getByLabelText(/^Login/), "  ")

    expect(within(dialog).getByRole("button", { name: "Save" })).toBeDisabled()
  })
})
