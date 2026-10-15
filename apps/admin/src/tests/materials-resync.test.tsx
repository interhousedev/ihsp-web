/** ACA-9: the EMIS materials re-sync takes the chosen academic years and halves, the current one by default. */
import { describe, expect, test } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { MaterialsResync } from "../features/monitoring/components/materials-resync"
import { configureTests, renderAdmin, waitUntil } from "./helpers"

configureTests()

function captureBody(): { body: unknown } {
  const seen: { body: unknown } = { body: undefined }
  server.use(
    http.post(apiUrl("/v1/admin/sync/materials"), async ({ request }) => {
      seen.body = await request.json()
      return new HttpResponse(null, { status: 202 })
    }),
  )
  return seen
}

async function confirm() {
  fireEvent.click(screen.getByRole("button", { name: "Replace materials" }))
  const dialog = await screen.findByRole("alertdialog")
  fireEvent.click(within(dialog).getByRole("button", { name: "Replace" }))
}

describe("materials re-sync", () => {
  test("the current term is chosen by default and sent", async () => {
    const seen = captureBody()
    renderAdmin(<MaterialsResync />)

    const current = await screen.findByRole("checkbox", { name: "2026-2027, half 1" })
    expect(current).toBeChecked()
    expect(screen.getByRole("checkbox", { name: "2025-2026, half 2" })).not.toBeChecked()
    await confirm()

    await waitUntil(() => seen.body !== undefined)
    expect(seen.body).toEqual({ terms: [{ academic_year: "2026-2027", half: 1 }] })
  })

  test("several terms can be chosen; none disables the button", async () => {
    const seen = captureBody()
    renderAdmin(<MaterialsResync />)

    const current = await screen.findByRole("checkbox", { name: "2026-2027, half 1" })
    fireEvent.click(current)
    expect(screen.getByRole("button", { name: "Replace materials" })).toBeDisabled()
    fireEvent.click(screen.getByRole("checkbox", { name: "2025-2026, half 2" }))
    fireEvent.click(current)
    await confirm()

    await waitUntil(() => seen.body !== undefined)
    expect(seen.body).toEqual({
      terms: [
        { academic_year: "2026-2027", half: 1 },
        { academic_year: "2025-2026", half: 2 },
      ],
    })
  })
})
