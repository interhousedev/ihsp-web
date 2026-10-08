import { describe, expect, it, setDefaultTimeout } from "bun:test"
import type { CourseStaffBody } from "@ihsp/api"
import { apiUrl, ids, server } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { StaffPage } from "../features/staff/components/staff-page"
import { authorSession, readBody, renderLms, testerSession } from "./helpers"

// The first render of a page in a cold test run takes several seconds.
setDefaultTimeout(60_000)

function renderStaff(session = authorSession) {
  return renderLms(<StaffPage courseId={ids.course} />, { route: `/edit/staff/?id=${ids.course}`, session })
}

describe("staff page", () => {
  it("lists staff with role, permissions and visibility", async () => {
    renderStaff()
    const author = (await screen.findByText("Rakhimov Timur")).closest("li") as HTMLElement
    expect(within(author).getByText("Author")).toBeInTheDocument()
    expect(within(author).getByText("Manage staff")).toBeInTheDocument()
    expect(within(author).getByText("Shown")).toBeInTheDocument()
    const tester = screen.getByText("Ihsp Admin").closest("li") as HTMLElement
    expect(within(tester).getByText("Hidden")).toBeInTheDocument()
  })

  it("adds a staff member with the permissions of a role preset", async () => {
    let body = null as CourseStaffBody | null
    server.use(
      http.post(apiUrl("/v1/lms/courses/:id/staff"), async ({ request }) => {
        body = await readBody<CourseStaffBody>(request)
        return HttpResponse.json({ user: { id: "u9", first_name: "Gavxar", last_name: "Kalandarova" }, ...body })
      }),
    )
    const { user } = renderStaff()
    await user.click(await screen.findByRole("button", { name: "Add staff member" }))
    const dialog = await screen.findByRole("dialog")
    await user.type(within(dialog).getByLabelText("Login"), "kalandarova.gavxar")
    await user.selectOptions(within(dialog).getByLabelText("Role preset"), "teacher")
    expect(within(dialog).getByLabelText("Role shown on the course page")).toHaveValue("Teacher")
    expect(within(dialog).getByRole("checkbox", { name: /^Edit/ })).toBeChecked()
    expect(within(dialog).getByRole("checkbox", { name: /^Manage staff/ })).not.toBeChecked()
    await user.click(within(dialog).getByRole("button", { name: "Add" }))
    await waitFor(() =>
      expect(body).toEqual({
        login: "kalandarova.gavxar",
        role: "Teacher",
        permissions: ["edit", "publish", "review", "view_drafts"],
        show_on_page: true,
        position: 3,
      }),
    )
  })

  it("shows an unknown login as an error inside the dialog (404 id/user-not-found)", async () => {
    const { user } = renderStaff()
    await user.click(await screen.findByRole("button", { name: "Add staff member" }))
    const dialog = await screen.findByRole("dialog")
    await user.type(within(dialog).getByLabelText("Login"), "nobody")
    await user.type(within(dialog).getByLabelText("Role shown on the course page"), "Support")
    await user.click(within(dialog).getByRole("button", { name: "Add" }))
    expect(await within(dialog).findByText("No user with this login was found.")).toBeInTheDocument()
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("rotates the invite code after a confirmation", async () => {
    const { user } = renderStaff()
    expect(await screen.findByLabelText("Invite code")).toHaveTextContent("KP7M2Q")
    await user.click(screen.getByRole("button", { name: "Create new code" }))
    const dialog = await screen.findByRole("alertdialog")
    await user.click(within(dialog).getByRole("button", { name: "Create new code" }))
    await waitFor(() => expect(screen.getByLabelText("Invite code")).toHaveTextContent("NX4R8T"))
  })

  it("is read-only for staff without manage_staff", async () => {
    renderStaff(testerSession)
    expect(await screen.findByText("Rakhimov Timur")).toBeInTheDocument()
    expect(screen.getByText("You can see the staff but not change it.")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Add staff member" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument()
  })
})
