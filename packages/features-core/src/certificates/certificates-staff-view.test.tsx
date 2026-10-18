/** CERT-6..8: staff certificates view: filters narrow the table and the stats, ZIP export, 403 for a non-curator. */
import { describe, expect, test } from "bun:test"
import {
  apiUrl,
  certificateTypes,
  ids,
  renderWithProviders,
  server,
  setCertificatesStaffForbidden,
  selectDropdownValue,
  setDropdownValue,
} from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
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

    setDropdownValue(screen.getByLabelText("Group"), ids.group2TN2)

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

describe("custom field filters", () => {
  const LABEL = { uz: "Yo'nalish", ru: "Направление", en: "Track" }
  const TRACK = {
    key: "track",
    kind: "multi",
    label: LABEL,
    required: false,
    options: ["math", "art"],
    allow_other: true,
  }
  const SCORE = {
    key: "score",
    kind: "number",
    label: { uz: "Ball", ru: "Балл", en: "Score" },
    required: false,
    options: [],
    allow_other: false,
  }

  test("one filter per custom field of the one selected type, sent as cf_ and cfmin_ params", async () => {
    const seen: { tracks: string[]; min: string | null } = { tracks: [], min: null }
    server.use(
      http.get(apiUrl("/v1/certificates/types"), () =>
        HttpResponse.json(
          certificateTypes.map((kind) => (kind.code === "ielts" ? { ...kind, custom_fields: [TRACK, SCORE] } : kind)),
        ),
      ),
      http.get(apiUrl("/v1/certificates/staff/fields/:key/values"), () =>
        HttpResponse.json({
          key: "track",
          kind: "multi",
          options: ["math", "art"],
          other_values: ["Chess club"],
          min: null,
          max: null,
        }),
      ),
      http.get(apiUrl("/v1/certificates/staff/entries"), ({ request }) => {
        const params = new URL(request.url).searchParams
        seen.tracks = params.getAll("cf_track")
        seen.min = params.get("cfmin_score")
        return HttpResponse.json({ items: [], total: 0 })
      }),
    )
    const { user } = renderWithProviders(<CertificatesStaffView />)
    await screen.findAllByText("Karimova Dilnoza")
    expect(screen.queryByLabelText("Track")).toBeNull()

    setDropdownValue(screen.getByLabelText("Type"), certificateTypes.find((kind) => kind.code === "ielts")!.id)

    const track = await screen.findByRole("combobox", { name: "Track" })
    await user.click(track)
    expect(await screen.findByRole("option", { name: "Chess club" })).toBeInTheDocument()
    for (const value of ["math", "Chess club"]) {
      await selectDropdownValue(user, screen.getByRole("combobox", { name: "Track" }), value)
      // Let each pick reach the query before the next one, as a user would.
      await waitFor(() => expect(seen.tracks).toContain(value))
    }
    await user.type(screen.getByLabelText("Score Min"), "500")

    await waitFor(() => expect(seen.min).toBe("500"))
    expect(seen.tracks).toEqual(["math", "Chess club"])
  })
})
