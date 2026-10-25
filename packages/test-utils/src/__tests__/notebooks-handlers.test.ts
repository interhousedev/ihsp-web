import { describe, expect, test } from "bun:test"
import {
  deleteNotebookLabel,
  getAiWebSearch,
  getArtifact,
  getArtifacts,
  getNotebook,
  getNotebookLabels,
  getNotebookSearch,
  getNotebooks,
  getNotebookSources,
  getPassage,
  patchNotebookLabel,
  postArtifact,
  postNotebookDiscover,
  postNotebookLabel,
  postNotebookLabelsAuto,
  postNotebookMessage,
  postNotebookSources,
  postNotebookSourcesSelect,
  putNotebookSourceLabels,
} from "@ihsp/api"
import { webQuotaSpent } from "../fixtures/ai"
import { nbIds, passageId } from "../fixtures/notebooks"
import { setWebQuota } from "../handlers"

describe("notebooks handlers", () => {
  test("lists the pinned notebook first and filters by title", async () => {
    const all = await getNotebooks()
    const found = await getNotebooks({ q: "photo" })

    expect(all.items[0]?.pinned).toBe(true)
    expect(found.items.map((item) => item.id)).toEqual([nbIds.notebook])
  })

  test("a new source goes pending, processing, ready over two polls", async () => {
    const added = await postNotebookSources(nbIds.notebook, {
      items: [{ kind: "text", title: "Extra", text: "One.\n\nTwo." }],
    })
    const id = added.items[0]?.id ?? ""

    expect(added.items[0]?.status).toBe("pending")
    expect((await getNotebookSources(nbIds.notebook)).find((s) => s.id === id)?.status).toBe("processing")
    expect((await getNotebookSources(nbIds.notebook)).find((s) => s.id === id)?.status).toBe("ready")
  })

  test("adding the same file twice is rejected as a duplicate", async () => {
    const item = { kind: "file", file_id: "0000-file" } as const
    await postNotebookSources(nbIds.notebook, { items: [item] })
    const second = await postNotebookSources(nbIds.notebook, { items: [item] })

    expect(second.items).toEqual([])
    expect(second.rejected[0]?.error.type).toBe("notebooks/source-duplicate")
  })

  test("deselecting every source makes a question fail with no-sources-selected", async () => {
    await postNotebookSourcesSelect(nbIds.notebook, { selected: false })
    const detail = await getNotebook(nbIds.notebook)

    expect(detail.selected_source_count).toBe(0)
    await expect(postNotebookMessage(nbIds.notebook, { text: "Hi" })).rejects.toMatchObject({
      type: "notebooks/no-sources-selected",
    })
  })

  test("a question returns a cited answer", async () => {
    const turn = await postNotebookMessage(nbIds.notebook, { text: "What is the Calvin cycle?" })

    expect(turn.assistant_message.citations).toHaveLength(2)
    expect(turn.assistant_message.text).toContain("⟦1⟧")
  })

  test("a new artifact goes queued, generating, ready and is unread until opened", async () => {
    const created = await postArtifact(nbIds.notebook, { kind: "quiz" })
    expect(created.status).toBe("queued")
    const find = async () => (await getArtifacts(nbIds.notebook)).find((a) => a.id === created.id)

    expect((await find())?.status).toBe("generating")
    const ready = await find()
    expect(ready?.status).toBe("ready")
    expect(ready?.unread).toBe(true)
    const detail = await getArtifact(nbIds.notebook, created.id)
    expect(detail.kind === "quiz" && detail.content?.questions.length).toBeGreaterThan(0)
    expect((await find())?.unread).toBe(false)
  })

  test("a passage comes with its neighbours", async () => {
    const detail = await getPassage(nbIds.notebook, passageId(1, 3), { context: 1 })

    expect(detail.before.map((p) => p.seq)).toEqual([2])
    expect(detail.after.map((p) => p.seq)).toEqual([4])
  })
})

describe("web search handlers", () => {
  test("a question with web search on spends one search and returns web pages", async () => {
    const turn = await postNotebookMessage(nbIds.notebook, { text: "Plants?", web_search: true })

    expect(turn.assistant_message.text).toContain("⟦w1⟧")
    expect(turn.assistant_message.web).toHaveLength(2)
    expect((await getAiWebSearch()).remaining).toBe(3)
  })

  test("a spent quota answers 429 web-search/quota-exceeded", async () => {
    setWebQuota(webQuotaSpent)

    await expect(postNotebookMessage(nbIds.notebook, { text: "Plants?", web_search: true })).rejects.toMatchObject({
      type: "web-search/quota-exceeded",
    })
  })

  test("Discover fast costs one search, deep costs deep_cost; already_added pages are marked", async () => {
    const fast = await postNotebookDiscover(nbIds.notebook, { query: "photosynthesis", mode: "fast" })
    expect(fast.results.map((r) => r.already_added)).toEqual([false, false, true])
    expect(fast.quota.remaining).toBe(3)

    const deep = await postNotebookDiscover(nbIds.notebook, { query: "photosynthesis", mode: "deep" })
    expect(deep.queries.length).toBeGreaterThan(1)
    expect(deep.quota.remaining).toBe(0)
  })

  test("adding a Discover page keeps the title the search found", async () => {
    const added = await postNotebookSources(nbIds.notebook, {
      items: [{ kind: "url", url: "https://example.org/a", title: "A page" }],
    })

    expect(added.items[0]?.title).toBe("A page")
  })
})

describe("search and labels handlers", () => {
  test("full-text search groups passages by source, at most three hits each", async () => {
    const result = await getNotebookSearch(nbIds.notebook, { q: "stroma" })

    expect(result.query).toBe("stroma")
    expect(result.sources.length).toBeGreaterThan(0)
    for (const group of result.sources) expect(group.hits.length).toBeLessThanOrEqual(3)
    await expect(getNotebookSearch(nbIds.notebook, { q: "x" })).rejects.toMatchObject({ status: 422 })
  })

  test("auto labels run in the background, then label the selected sources", async () => {
    expect((await getNotebookLabels(nbIds.notebook)).items).toEqual([])
    await postNotebookLabelsAuto(nbIds.notebook)

    expect((await getNotebookLabels(nbIds.notebook)).auto.status).toBe("running")
    const done = await getNotebookLabels(nbIds.notebook)
    expect(done.auto.status).toBe("idle")
    expect(done.items.map((l) => l.origin)).toEqual(["auto", "auto"])
    const sources = await getNotebookSources(nbIds.notebook)
    expect(sources.some((s) => s.label_ids.length > 0)).toBe(true)
  })

  test("manual labels: create, rename (becomes manual), assign to a source, delete", async () => {
    const created = await postNotebookLabel(nbIds.notebook, { name: "Exam", emoji: "📝" })
    expect(created.origin).toBe("manual")
    const sourceId = (await getNotebookSources(nbIds.notebook))[0]?.id ?? ""

    const source = await putNotebookSourceLabels(nbIds.notebook, sourceId, { label_ids: [created.id] })
    expect(source.label_ids).toEqual([created.id])
    expect((await patchNotebookLabel(nbIds.notebook, created.id, { name: "Exams" })).name).toBe("Exams")
    expect((await getNotebookLabels(nbIds.notebook)).items[0]?.source_count).toBe(1)

    await deleteNotebookLabel(nbIds.notebook, created.id)
    expect((await getNotebookSources(nbIds.notebook))[0]?.label_ids).toEqual([])
  })
})
