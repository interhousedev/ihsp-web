/** CERT-6..8: staff certificates view: filters narrow the table and the stats, ZIP export, 403 for a non-curator. */
import { describe, expect, test } from "bun:test"
import { apiUrl, ids, renderWithProviders, server, setCertificatesStaffForbidden } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { chartModel } from "./certificate-stats"
import { CertificatesStaffView } from "./certificates-staff-view"

describe("certificates staff view", () => {
  test("shows all entries, stats lines and the ranking", async () => {
    renderWithProviders(<CertificatesStaffView />)

    expect(await screen.findAllByText("Karimova Dilnoza")).not.toHaveLength(0)
    expect(screen.getAllByText("Brastilov Aleksey").length).toBeGreaterThan(0)
    expect(await screen.findByText("Most certificates")).toBeInTheDocument()
    expect(screen.getByText("2TN2: 7.0 1")).toBeInTheDocument()
  })

  test("the group filter narrows the table and the stats and is sent to the API", async () => {
    const seen: string[] = []
    server.use(
      http.get(apiUrl("/v1/certificates/staff/stats"), ({ request }) => {
        seen.push(new URL(request.url).searchParams.get("group_id") ?? "")
        return HttpResponse.json({ types: [] })
      }),
    )
    renderWithProviders(<CertificatesStaffView />)
    await screen.findAllByText("Karimova Dilnoza")

    fireEvent.change(screen.getByLabelText("Group"), { target: { value: ids.group2TN2 } })

    await waitFor(() => expect(screen.queryAllByText("Karimova Dilnoza")).toHaveLength(0))
    expect(seen).toContain(ids.group2TN2)
    expect(await screen.findByText("Nothing to show for these filters.")).toBeInTheDocument()
  })

  test("downloads a ZIP of the selected files", async () => {
    let body: unknown = null
    server.use(
      http.post(apiUrl("/v1/certificates/staff/export"), async ({ request }) => {
        body = await request.json()
        return new HttpResponse(new Blob(["zip"]), { headers: { "Content-Type": "application/zip" } })
      }),
    )
    URL.createObjectURL = () => "blob:x"
    URL.revokeObjectURL = () => undefined
    const { user } = renderWithProviders(<CertificatesStaffView />)
    await screen.findAllByText("Karimova Dilnoza")

    const row = screen
      .getAllByRole("row")
      .find((r) => within(r).queryByText("Brastilov Aleksey") && within(r).queryByText("1 file(s)"))!
    await user.click(within(row).getByRole("checkbox"))
    await user.click(screen.getByRole("button", { name: "Download ZIP (1)" }))

    await waitFor(() => expect(body).not.toBeNull())
    expect(body).toEqual({ file_ids: expect.any(Array) })
  })

  test("a teacher without a group gets a notice on 403", async () => {
    setCertificatesStaffForbidden(true)
    renderWithProviders(<CertificatesStaffView />)

    expect(await screen.findByText(/available to curators of a group/)).toBeInTheDocument()
  })

  test("chart model has one stacked series per level", () => {
    const { config, rows } = chartModel({
      type_id: "t",
      levels: ["A1", "B1"],
      groups: [{ group_id: "g", group_name: "2TN2", counts: { B1: 3 } }],
    })

    expect(Object.keys(config)).toEqual(["l0", "l1"])
    expect(rows).toEqual([{ group: "2TN2", l0: 0, l1: 3 }])
  })
})
