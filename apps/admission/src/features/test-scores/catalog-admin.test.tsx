import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import type { ScoreCatalog } from "./api"
import { CatalogAdminBody } from "./components/catalog-admin-page"

const BASE = "/v1/admission/test-scores/catalog"
const part = { key: "math", names: { en: "Math" }, min: 200, max: 800, step: 10, choices: [] }
const catalog: ScoreCatalog = {
  can_edit: true,
  items: [
    {
      id: "t-sat",
      key: "sat",
      names: { en: "SAT" },
      sections: [part],
      total: { ...part, key: "total" },
      total_mode: "sum",
      superscore: true,
      needs_label: false,
      needs_level: false,
      position: 1,
      active: true,
    },
  ],
}

describe("test catalog admin", () => {
  test("lists tests and saves an edit through PUT", async () => {
    let body: unknown
    server.use(
      http.get(apiUrl(BASE), () => HttpResponse.json(catalog)),
      http.put(apiUrl(`${BASE}/t-sat`), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(catalog.items[0])
      }),
    )
    renderAdmissionApp(<CatalogAdminBody />)
    fireEvent.click(await screen.findByRole("button", { name: "Edit" }))
    fireEvent.change(await screen.findByLabelText("Name (en)"), { target: { value: "SAT II" } })
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(body).toMatchObject({ key: "sat", total_mode: "sum", names: { en: "SAT II" } }))
  })

  test("deletes only after the confirm dialog", async () => {
    let deleted = 0
    server.use(
      http.get(apiUrl(BASE), () => HttpResponse.json(catalog)),
      http.delete(apiUrl(`${BASE}/t-sat`), () => {
        deleted += 1
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderAdmissionApp(<CatalogAdminBody />)
    fireEvent.click(await screen.findByRole("button", { name: "Delete" }))
    expect(deleted).toBe(0)
    const dialog = await screen.findByRole("alertdialog")
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }))
    await waitFor(() => expect(deleted).toBe(1))
  })
})
