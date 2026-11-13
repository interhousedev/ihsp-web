/** Login cues (admin): list with a group filter, add one cue with validation, paste many, delete with confirmation. */
import { describe, expect, test } from "bun:test"
import { apiUrl, ids, selectDropdownOption, server, setDropdownValue } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { LoginCuesPage } from "../features/login-cues/components/login-cues-page"
import { configureTests, renderAdmin, setValue } from "./helpers"

configureTests()

const cue = {
  id: "cue-1",
  full_name: "Aliyev Ali",
  group_id: ids.group2TN2,
  group_name: "2TN2",
  login_masked: "2024•••••3",
  consumed_at: null,
  created_at: "2026-09-01T06:00:00Z",
}

describe("login cues page", () => {
  test("LC-ADM-01 lists the cues of the chosen group with their masked login", async () => {
    const queries: string[] = []
    server.use(
      http.get(apiUrl("/v1/admin/login-cues"), ({ request }) => {
        queries.push(new URL(request.url).search)
        return HttpResponse.json([cue])
      }),
    )
    renderAdmin(<LoginCuesPage />, { route: "/login-cues/" })

    const table = await screen.findByRole("table")
    expect(within(table).getByText("Aliyev Ali")).toBeInTheDocument()
    expect(within(table).getByText("2024•••••3")).toBeInTheDocument()
    expect(within(table).queryByText("20240123456")).toBeNull()
    expect(queries[0]).not.toContain("group_id")
  })

  test("LC-ADM-03 keeps the chosen group filter in the URL and sends it to the list", async () => {
    const queries: string[] = []
    server.use(
      http.get(apiUrl("/v1/admin/login-cues"), ({ request }) => {
        queries.push(new URL(request.url).search)
        return HttpResponse.json([cue])
      }),
    )
    renderAdmin(<LoginCuesPage />, { route: `/login-cues/?group_id=${ids.group2TN2}` })

    await screen.findByRole("table")
    expect(queries[0]).toContain(`group_id=${ids.group2TN2}`)
  })

  test("LC-ADM-02 refuses an EMIS login with letters and saves digits only", async () => {
    let body = null as Record<string, unknown> | null
    server.use(
      http.post(apiUrl("/v1/admin/login-cues"), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ ...cue, id: "new" }, { status: 201 })
      }),
    )
    server.use(http.get(apiUrl("/v1/admin/login-cues"), () => HttpResponse.json([cue])))
    const { user } = renderAdmin(<LoginCuesPage />, { route: "/login-cues/" })
    await screen.findByRole("table")

    await user.click(screen.getByRole("button", { name: "Add name" }))
    const dialog = await screen.findByRole("dialog")
    setValue(within(dialog).getByLabelText(/Full name/), "Karimova Dilnoza")
    await selectDropdownOption(user, within(dialog).getByRole("combobox", { name: /Group/ }), "2TN2")
    setValue(within(dialog).getByLabelText(/EMIS login/), "12ab")
    await user.click(within(dialog).getByRole("button", { name: "Add" }))
    expect(await within(dialog).findByText("The EMIS login is digits only.")).toBeInTheDocument()
    expect(body).toBeNull()

    setValue(within(dialog).getByLabelText(/EMIS login/), "20240123456")
    await user.click(within(dialog).getByRole("button", { name: "Add" }))

    await waitFor(() => expect(body).not.toBeNull())
    expect(body).toMatchObject({
      full_name: "Karimova Dilnoza",
      group_id: ids.group2TN2,
      emis_login: "20240123456",
    })
  })

  test("LC-ADM-03 pastes login;name lines for one group and reports the bad lines", async () => {
    let body = null as { items: Array<Record<string, unknown>> } | null
    server.use(
      http.post(apiUrl("/v1/admin/login-cues/bulk"), async ({ request }) => {
        body = (await request.json()) as { items: Array<Record<string, unknown>> }
        return HttpResponse.json({ created: [] }, { status: 201 })
      }),
    )
    server.use(http.get(apiUrl("/v1/admin/login-cues"), () => HttpResponse.json([cue])))
    const { user } = renderAdmin(<LoginCuesPage />, { route: "/login-cues/" })
    await screen.findByRole("table")

    await user.click(screen.getByRole("button", { name: "Paste list" }))
    const dialog = await screen.findByRole("dialog")
    setDropdownValue(within(dialog).getByRole("combobox", { name: /Group/ }), ids.group2TN2)
    setValue(
      within(dialog).getByLabelText(/Lines/),
      "20240123;Aliyev Ali\n\nxyz;Bad Login\nno separator here\n20240124;Karimova Dilnoza",
    )

    expect(await within(dialog).findByText(/Lines recognised: 2/)).toBeInTheDocument()
    expect(within(dialog).getByText(/Check lines: 3, 4\./)).toBeInTheDocument()
    expect(within(dialog).getByRole("button", { name: "Add all" })).toBeDisabled()

    setValue(within(dialog).getByLabelText(/Lines/), "20240123;Aliyev Ali\n20240124;Karimova Dilnoza")
    await user.click(await within(dialog).findByRole("button", { name: "Add all" }))

    await waitFor(() => expect(body).not.toBeNull())
    expect(body?.items).toEqual([
      { emis_login: "20240123", full_name: "Aliyev Ali", group_id: ids.group2TN2 },
      { emis_login: "20240124", full_name: "Karimova Dilnoza", group_id: ids.group2TN2 },
    ])
  })

  test("LC-ADM-04 deletes a cue only after confirmation", async () => {
    let deleted = false
    server.use(
      http.get(apiUrl("/v1/admin/login-cues"), () => HttpResponse.json([cue])),
      http.delete(apiUrl("/v1/admin/login-cues/cue-1"), () => {
        deleted = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderAdmin(<LoginCuesPage />, { route: "/login-cues/" })
    await screen.findByRole("table")

    await user.click(screen.getAllByRole("button", { name: "Delete Aliyev Ali" })[0] as HTMLElement)
    const dialog = await screen.findByRole("alertdialog")
    expect(deleted).toBe(false)
    await user.click(within(dialog).getByRole("button", { name: "Delete" }))

    await waitFor(() => expect(deleted).toBe(true))
  })
})

describe("login cues mass select", () => {
  const second = { ...cue, id: "cue-2", full_name: "Karimova Dilnoza" }
  const third = { ...cue, id: "cue-3", full_name: "Sodiqov Sardor" }

  test("LC-ADM-05 deletes the selected cues in one request and drops them from the list", async () => {
    let rows = [cue, second, third]
    let body = null as { ids: string[] } | null
    server.use(
      http.get(apiUrl("/v1/admin/login-cues"), () => HttpResponse.json(rows)),
      http.post(apiUrl("/v1/admin/login-cues/bulk-delete"), async ({ request }) => {
        body = (await request.json()) as { ids: string[] }
        rows = rows.filter((row) => !body?.ids.includes(row.id))
        return HttpResponse.json({ deleted: body.ids.length })
      }),
    )
    const { user } = renderAdmin(<LoginCuesPage />, { route: "/login-cues/" })
    const table = await screen.findByRole("table")

    await user.click(within(table).getByRole("checkbox", { name: "Select Aliyev Ali" }))
    await user.click(within(table).getByRole("checkbox", { name: "Select Sodiqov Sardor" }))
    expect(screen.getByText("Selected: 2")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Delete selected" }))
    const dialog = await screen.findByRole("alertdialog")
    await user.click(within(dialog).getByRole("button", { name: "Delete" }))

    await waitFor(() => expect(body).not.toBeNull())
    expect(body?.ids).toEqual(["cue-1", "cue-3"])
    await waitFor(() => expect(within(screen.getByRole("table")).queryByText("Aliyev Ali")).toBeNull())
    expect(within(screen.getByRole("table")).getByText("Karimova Dilnoza")).toBeInTheDocument()
    expect(screen.queryByText(/Selected:/)).toBeNull()
  })

  test("LC-ADM-06 select all toggles every visible cue and clear selection resets", async () => {
    server.use(http.get(apiUrl("/v1/admin/login-cues"), () => HttpResponse.json([cue, second])))
    const { user } = renderAdmin(<LoginCuesPage />, { route: "/login-cues/" })
    const table = await screen.findByRole("table")

    const all = screen.getByRole("checkbox", { name: "Select all" })
    await user.click(all)
    expect(screen.getByText("Selected: 2")).toBeInTheDocument()
    expect(within(table).getByRole("checkbox", { name: "Select Aliyev Ali" })).toBeChecked()
    await user.click(all)
    expect(screen.queryByText(/Selected:/)).toBeNull()

    await user.click(within(table).getByRole("checkbox", { name: "Select Aliyev Ali" }))
    await user.click(screen.getByRole("button", { name: "Clear selection" }))
    expect(screen.queryByText(/Selected:/)).toBeNull()
  })

  test("LC-ADM-07 shows an empty state when the feature is switched off", async () => {
    server.use(
      http.get(apiUrl("/v1/admin/login-cues"), () =>
        HttpResponse.json(
          { type: "notebooks/feature-disabled", title: "Feature disabled", status: 404 },
          { status: 404, headers: { "content-type": "application/problem+json" } },
        ),
      ),
    )
    renderAdmin(<LoginCuesPage />, { route: "/login-cues/" })

    expect(await screen.findByText("Login cues are switched off.")).toBeInTheDocument()
  })
})
