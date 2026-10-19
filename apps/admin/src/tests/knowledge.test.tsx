/** ADM-KB-1..5: knowledge base page lists, searches, creates, edits and deletes entries; a taken key is reported. */
import { describe, expect, test } from "bun:test"
import { apiUrl, knowledgeEntries, server } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { KnowledgePage } from "../features/knowledge/components/knowledge-page"
import { configureTests, renderAdmin, setValue, waitUntil } from "./helpers"

configureTests()

const route = "/knowledge/"

describe("knowledge page", () => {
  test("lists entries with key, title, tags and update time", async () => {
    renderAdmin(<KnowledgePage />, { route })

    expect(await screen.findByText("school-hours")).toBeInTheDocument()
    expect(screen.getByText("School hours")).toBeInTheDocument()
    expect(screen.getByText("schedule")).toBeInTheDocument()
    expect(screen.getByText("uniform")).toBeInTheDocument()
  })

  test("typing in the search box asks the API with q after a pause", async () => {
    const seen: (string | null)[] = []
    server.use(
      http.get(apiUrl("/v1/admin/knowledge"), ({ request }) => {
        seen.push(new URL(request.url).searchParams.get("q"))
        return HttpResponse.json({ items: [knowledgeEntries[1]], total: 1, limit: 20, offset: 0 })
      }),
    )
    renderAdmin(<KnowledgePage />, { route })
    await screen.findByText("uniform")

    setValue(screen.getByRole("searchbox", { name: "Search" }), "uni")

    await waitUntil(() => seen.includes("uni"), "no search request")
    expect(screen.queryByText("school-hours")).not.toBeInTheDocument()
  })

  test("creating an entry sends key, title, text and tags", async () => {
    let body: unknown
    server.use(
      http.post(apiUrl("/v1/admin/knowledge"), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ ...knowledgeEntries[0], id: "new" })
      }),
    )
    const { user } = renderAdmin(<KnowledgePage />, { route })
    await screen.findByText("uniform")

    await user.click(screen.getByRole("button", { name: "Add entry" }))
    const dialog = await screen.findByRole("dialog")
    setValue(within(dialog).getByLabelText(/Key/), "canteen")
    setValue(within(dialog).getByLabelText("Title"), "Canteen")
    setValue(within(dialog).getByLabelText(/Text/), "Open from 12:00.")
    setValue(within(dialog).getByLabelText("Tags"), "food, general, food")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitUntil(() => body !== undefined, "no request")
    expect(body).toEqual({ key: "canteen", title: "Canteen", value: "Open from 12:00.", tags: ["food", "general"] })
  })

  test("a taken key shows the error in the dialog and keeps it open", async () => {
    const { user } = renderAdmin(<KnowledgePage />, { route })
    await screen.findByText("uniform")

    await user.click(screen.getByRole("button", { name: "Add entry" }))
    const dialog = await screen.findByRole("dialog")
    setValue(within(dialog).getByLabelText(/Key/), "UNIFORM")
    setValue(within(dialog).getByLabelText(/Text/), "x")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    expect(await within(dialog).findByRole("alert")).toHaveTextContent("This key is already used by another entry.")
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  test("editing an entry patches it", async () => {
    let patched: { id: string; body: unknown } | undefined
    server.use(
      http.patch(apiUrl("/v1/admin/knowledge/:id"), async ({ params, request }) => {
        patched = { id: String(params.id), body: await request.json() }
        return HttpResponse.json(knowledgeEntries[1])
      }),
    )
    const { user } = renderAdmin(<KnowledgePage />, { route })
    await screen.findByText("uniform")

    await user.click(screen.getByRole("button", { name: "Edit entry uniform" }))
    const dialog = await screen.findByRole("dialog")
    setValue(within(dialog).getByLabelText(/Text/), "Uniform is optional on Fridays.")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitUntil(() => patched !== undefined, "no request")
    expect(patched).toEqual({
      id: knowledgeEntries[1]?.id ?? "",
      body: { key: "uniform", title: null, value: "Uniform is optional on Fridays.", tags: ["rules"] },
    })
  })

  test("deleting asks for confirmation first", async () => {
    let deleted: string | undefined
    server.use(
      http.delete(apiUrl("/v1/admin/knowledge/:id"), ({ params }) => {
        deleted = String(params.id)
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderAdmin(<KnowledgePage />, { route })
    await screen.findByText("uniform")

    await user.click(screen.getByRole("button", { name: "Delete entry uniform" }))
    const dialog = await screen.findByRole("alertdialog")
    expect(deleted).toBeUndefined()
    await user.click(within(dialog).getByRole("button", { name: "Delete" }))

    await waitUntil(() => deleted !== undefined, "no request")
    expect(deleted).toBe(knowledgeEntries[1]?.id)
  })
})
