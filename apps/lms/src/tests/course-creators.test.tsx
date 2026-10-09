/** LMS-21: LMS admins manage the course creators; creators and admins see "Create course". */
import { describe, expect, it, setDefaultTimeout } from "bun:test"
import type { CourseCreator } from "@ihsp/api"
import { resetConfig } from "@ihsp/config"
import { adminStudentUser, adminTeacherUser, apiUrl, ids, server, teacherMe } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { AdminPage } from "../features/admin/components/admin-page"
import { LmsShell } from "../features/shell/components/lms-shell"
import { renderLms } from "./helpers"

// The first render of a page in a cold test run takes several seconds.
setDefaultTimeout(60_000)

const lmsAdmin = { user: { ...teacherMe, roles: ["admin" as const, "lms_admin" as const] } }
const creatorOnly = { user: { ...teacherMe, roles: ["teacher" as const, "lms_creator" as const] } }

const existing: CourseCreator = {
  id: ids.teacherRakhimov,
  login: "rakhimov.timur",
  first_name: "Timur",
  last_name: "Rakhimov",
  middle_name: null,
  status: "active",
}

function useCreatorHandlers(items: CourseCreator[] = [existing]) {
  server.use(
    http.get(apiUrl("/v1/staff/lms/creators"), () => HttpResponse.json({ items, next_cursor: null })),
    http.get(apiUrl("/v1/admin/users"), () =>
      HttpResponse.json({ items: [adminTeacherUser, adminStudentUser], next_cursor: null }),
    ),
  )
}

describe("course creators", () => {
  it("lists the creators for an LMS admin", async () => {
    useCreatorHandlers()
    renderLms(<AdminPage />, { session: lmsAdmin })

    const list = await screen.findByRole("list", { name: "Current course creators" })
    expect(within(list).getByText(/Rakhimov Timur/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Create course" })).toBeInTheDocument()
  })

  it("finds teachers and administrators only and adds one as a creator", async () => {
    let putId = ""
    useCreatorHandlers()
    server.use(
      http.put(apiUrl("/v1/staff/lms/creators/:id"), ({ params }) => {
        putId = String(params.id)
        return HttpResponse.json({ ...existing, id: putId, login: adminTeacherUser.login })
      }),
    )
    const { user } = renderLms(<AdminPage />, { session: lmsAdmin })

    await user.type(await screen.findByLabelText("Find a teacher or administrator"), "kalandarova")
    await user.click(screen.getByRole("button", { name: "Search" }))

    const results = await screen.findByRole("list", { name: "Search results" })
    expect(within(results).getAllByRole("listitem")).toHaveLength(1)
    expect(within(results).queryByText(/Brastilov/)).not.toBeInTheDocument()
    await user.click(within(results).getByRole("button", { name: "Add" }))

    await waitFor(() => expect(putId).toBe(adminTeacherUser.id))
  })

  it("marks a person who already is a creator instead of offering Add", async () => {
    useCreatorHandlers([{ ...existing, id: adminTeacherUser.id }])
    const { user } = renderLms(<AdminPage />, { session: lmsAdmin })

    await user.type(await screen.findByLabelText("Find a teacher or administrator"), "kalandarova")
    await user.click(screen.getByRole("button", { name: "Search" }))

    const results = await screen.findByRole("list", { name: "Search results" })
    expect(within(results).queryByRole("button", { name: "Add" })).not.toBeInTheDocument()
    expect(within(results).getByText("Course creator")).toBeInTheDocument()
  })

  it("removes a creator after a confirmation", async () => {
    let deleted = ""
    useCreatorHandlers()
    server.use(
      http.delete(apiUrl("/v1/staff/lms/creators/:id"), ({ params }) => {
        deleted = String(params.id)
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderLms(<AdminPage />, { session: lmsAdmin })

    const list = await screen.findByRole("list", { name: "Current course creators" })
    await user.click(within(list).getByRole("button", { name: "Remove" }))
    const dialog = await screen.findByRole("alertdialog")
    expect(deleted).toBe("")
    await user.click(within(dialog).getByRole("button", { name: "Remove" }))

    await waitFor(() => expect(deleted).toBe(ids.teacherRakhimov))
  })

  it("a creator who is no LMS admin can create courses but sees no creators section", async () => {
    renderLms(<AdminPage />, { session: creatorOnly })

    expect(await screen.findByRole("button", { name: "Create course" })).toBeInTheDocument()
    expect(screen.queryByText("Course creators")).not.toBeInTheDocument()
  })
})

describe("navigation", () => {
  for (const [label, session] of [
    ["a course creator", creatorOnly],
    ["an LMS admin", lmsAdmin],
  ] as const) {
    it(`shows "Create course" to ${label}`, async () => {
      window.__ENV__ = { ...(window.__ENV__ as object), OAUTH_CLIENT_ID: "lms" }
      resetConfig()
      renderLms(
        <LmsShell>
          <p>page body</p>
        </LmsShell>,
        { session },
      )

      expect((await screen.findAllByRole("link", { name: "Create course" })).length).toBeGreaterThan(0)
    })
  }

  it('hides "Create course" from a plain teacher', async () => {
    window.__ENV__ = { ...(window.__ENV__ as object), OAUTH_CLIENT_ID: "lms" }
    resetConfig()
    renderLms(
      <LmsShell>
        <p>page body</p>
      </LmsShell>,
      { session: { user: { ...teacherMe, roles: ["teacher"] } } },
    )

    await screen.findByText("page body")
    expect(screen.queryByRole("link", { name: "Create course" })).not.toBeInTheDocument()
  })
})
