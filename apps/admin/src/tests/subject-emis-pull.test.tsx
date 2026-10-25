/** EMIS pull of one subject: the whole subject (full) and "Pull new materials" per teacher or group (soft). */
import { describe, expect, test } from "bun:test"
import { apiUrl, ids, server, subjects } from "@ihsp/test-utils"
import { fireEvent, screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { SubjectsPage } from "../features/subjects/components/subjects-page"
import { configureTests, renderAdmin, waitUntil } from "./helpers"

configureTests()

const SUBJECT = subjects[0]!

function capture(): { bodies: unknown[] } {
  const seen = { bodies: [] as unknown[] }
  server.use(
    http.post(apiUrl(`/v1/admin/subjects/${SUBJECT.id}/emis-pull`), async ({ request }) => {
      seen.bodies.push(await request.json())
      return new HttpResponse(null, { status: 202 })
    }),
  )
  return seen
}

async function openDialog() {
  renderAdmin(<SubjectsPage />)
  fireEvent.click(await screen.findByRole("button", { name: `EMIS pull for ${SUBJECT.name.en}` }))
  return screen.findByRole("dialog")
}

describe("subject EMIS pull", () => {
  test("lists the teachers and groups, each with a soft pull", async () => {
    const seen = capture()
    const dialog = await openDialog()

    const teachers = await within(dialog).findByRole("list", { name: "Teachers" })
    const groups = within(dialog).getByRole("list", { name: "Groups" })
    expect(within(teachers).getByText("Kalandarova Gavxar")).toBeTruthy()
    expect(within(groups).getByText("2TN2")).toBeTruthy()

    await within(dialog).findByRole("checkbox", { name: "2026-2027, half 1" })
    fireEvent.click(within(teachers).getByRole("button", { name: "Pull new materials for Kalandarova Gavxar" }))
    await waitUntil(() => seen.bodies.length === 1)
    fireEvent.click(within(groups).getByRole("button", { name: "Pull new materials for 2TN2" }))
    await waitUntil(() => seen.bodies.length === 2)

    expect(seen.bodies).toEqual([
      { mode: "soft", teacher_id: ids.teacherKalandarova },
      { mode: "soft", group_id: ids.group2TN2 },
    ])
  })

  test("Pull from EMIS replaces the subject in the current term after a confirmation", async () => {
    const seen = capture()
    const dialog = await openDialog()

    await within(dialog).findByRole("checkbox", { name: "2026-2027, half 1" })
    fireEvent.click(within(dialog).getByRole("button", { name: "Pull from EMIS" }))
    const confirm = await screen.findByRole("alertdialog")
    fireEvent.click(within(confirm).getByRole("button", { name: "Pull" }))

    await waitUntil(() => seen.bodies.length === 1)
    expect(seen.bodies[0]).toEqual({ mode: "full" })
  })

  test("another term chosen is sent as terms", async () => {
    const seen = capture()
    const dialog = await openDialog()

    fireEvent.click(await within(dialog).findByRole("checkbox", { name: "2025-2026, half 2" }))
    fireEvent.click(within(dialog).getByRole("button", { name: "Pull from EMIS" }))
    fireEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Pull" }))

    await waitUntil(() => seen.bodies.length === 1)
    expect(seen.bodies[0]).toEqual({
      mode: "full",
      terms: [
        { academic_year: "2026-2027", half: 1 },
        { academic_year: "2025-2026", half: 2 },
      ],
    })
  })
})
