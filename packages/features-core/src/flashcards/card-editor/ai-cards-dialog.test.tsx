import { describe, expect, it, mock } from "bun:test"
import { apiUrl, filePdf, problem, renderWithProviders, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { AiCardsDialog } from "./ai-cards-dialog"

const NB = "01900000-0000-7000-8000-00000000f1a5"
const source = { id: "s1", notebook_id: NB, status: "ready", title: "Mitosis" }
const cards = [
  { id: "c1", front: "What is mitosis?", back: "Cell division", hint: null, topic: null, refs: [] },
  { id: "c2", front: "What is a spindle?", back: "Fibres", hint: null, topic: null, refs: [] },
]

function stub(captured: { workspace?: unknown; artifact?: unknown } = {}) {
  server.use(
    http.get(apiUrl("/v1/notebooks"), () => HttpResponse.json({ items: [], next_cursor: null })),
    http.get(apiUrl("/v1/me/files"), () => HttpResponse.json({ items: [filePdf], total: 1, page: 1, page_size: 6 })),
    http.post(apiUrl("/v1/notebooks/flashcard-workspace"), async ({ request }) => {
      captured.workspace = await request.json()
      return HttpResponse.json({ notebook_id: NB, sources: [source] })
    }),
    http.get(apiUrl(`/v1/notebooks/${NB}/sources`), () => HttpResponse.json([source])),
    http.post(apiUrl(`/v1/notebooks/${NB}/artifacts`), async ({ request }) => {
      captured.artifact = await request.json()
      return HttpResponse.json({ id: "a1", kind: "flashcards", status: "queued" }, { status: 202 })
    }),
    http.get(apiUrl(`/v1/notebooks/${NB}/artifacts/a1`), () =>
      HttpResponse.json({ id: "a1", kind: "flashcards", status: "ready", content: { title: "T", cards } }),
    ),
  )
}

async function pickFileAndGenerate() {
  fireEvent.click(await screen.findByRole("button", { name: new RegExp(filePdf.name) }))
  fireEvent.click(screen.getByRole("button", { name: "Generate" }))
}

describe("AiCardsDialog", () => {
  it("generates from the chosen file and adds only the cards kept in the preview", async () => {
    const captured: { workspace?: unknown; artifact?: unknown } = {}
    stub(captured)
    const onAdd = mock((_cards: { front: string; back: string }[]) => undefined)
    renderWithProviders(<AiCardsDialog open onOpenChange={() => undefined} onAdd={onAdd} />)

    await pickFileAndGenerate()
    const list = await screen.findByRole("list", { name: "Generated cards" }, { timeout: 5000 })
    fireEvent.click(within(list).getAllByRole("checkbox")[1] as HTMLElement)
    fireEvent.click(screen.getByRole("button", { name: "Add 1 card" }))

    expect(captured.workspace).toEqual({ notebook_sources: [], file_ids: [filePdf.id] })
    expect(captured.artifact).toMatchObject({ kind: "flashcards", options: { count: "standard", source_ids: ["s1"] } })
    expect(onAdd).toHaveBeenCalledWith([{ front: "What is mitosis?", back: "Cell division" }])
  })

  it("does not start without a source", async () => {
    stub()
    renderWithProviders(<AiCardsDialog open onOpenChange={() => undefined} onAdd={() => undefined} />)

    expect((await screen.findByRole("button", { name: "Generate" })).hasAttribute("disabled")).toBe(true)
  })

  it("shows the refusal of the server and adds nothing", async () => {
    stub()
    server.use(
      http.post(apiUrl("/v1/notebooks/flashcard-workspace"), () => problem(404, "notebooks/not-found", "Not found")),
    )
    const onAdd = mock(() => undefined)
    renderWithProviders(<AiCardsDialog open onOpenChange={() => undefined} onAdd={onAdd} />)

    await pickFileAndGenerate()

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument())
    expect(onAdd).not.toHaveBeenCalled()
  })
})
