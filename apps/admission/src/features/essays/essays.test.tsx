import { apiUrl, server, setTestRoute, testRouter } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import type { Essay, EssaySummary } from "./api"
import type { MatchSlot } from "./flow/steps-api"
import { CoachPanel } from "./components/coach-panel"
import { EssayEditor } from "./components/essay-editor"
import { EssaysBody } from "./components/essays-page"
import { LifeStory } from "./components/life-story"
import { wordDiff } from "./diff"

const essay: Essay = {
  id: "e1",
  kind: "personal_statement",
  title: "Why physics",
  prompt_text: "",
  word_limit: 650,
  list_entry_id: null,
  body: "One two",
  word_count: 2,
  notes: "",
  plan: [],
  links: [],
  status: "draft",
  current_version: 0,
  lock_version: 3,
  forked_from: null,
  targets: [],
  updated_at: "2026-01-01T00:00:00Z",
}

const summary = ({ body: _b, notes: _n, plan: _p, links: _l, lock_version: _v, prompt_text: _t, ...rest }: Essay): EssaySummary => ({
  ...rest,
  uniqueness: null,
  deep_read: "none",
  deep_read_at: null,
})

const editorHandlers = () => [
  http.get(apiUrl("/v1/admission/me/items"), () => HttpResponse.json({ items: [], next_cursor: null })),
  http.get(apiUrl("/v1/admission/essays/e1"), () => HttpResponse.json(essay)),
  http.get(apiUrl("/v1/admission/me/profile"), () => HttpResponse.json({ answers: {} })),
  http.get(apiUrl("/v1/admission/list"), () => HttpResponse.json([])),
  http.get(apiUrl("/v1/admission/essays"), () => HttpResponse.json({ items: [summary(essay)] })),
]

const consentBody = (active: boolean) => ({
  grants: [{ purpose: "admission_ai", active, granted_at: "2026-01-01T00:00:00Z", withdrawn_at: null }],
})

describe("essays", () => {
  test("autosaves the draft with the lock version", async () => {
    let body: Record<string, unknown> | undefined
    server.use(
      ...editorHandlers(),
      http.patch(apiUrl("/v1/admission/essays/e1"), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ ...essay, body: "One two three", word_count: 3, lock_version: 4 })
      }),
    )
    renderAdmissionApp(<EssayEditor essay={essay} />)
    fireEvent.change(screen.getByLabelText("Essay text"), { target: { value: "One two three" } })
    await waitFor(() => expect(body).toMatchObject({ body: "One two three", lock_version: 3 }), { timeout: 4000 })
    await screen.findByText("Saved")
  })

  test("clearing the word limit saves an explicit null", async () => {
    let body: Record<string, unknown> | undefined
    server.use(
      ...editorHandlers(),
      http.patch(apiUrl("/v1/admission/essays/e1"), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ ...essay, word_limit: null, lock_version: 4 })
      }),
    )
    renderAdmissionApp(<EssayEditor essay={essay} />)
    fireEvent.click(document.querySelector("[aria-controls='essay-meta-body']") as HTMLElement)
    fireEvent.change(screen.getByLabelText("Word limit"), { target: { value: "" } })
    await waitFor(() => expect(body).toMatchObject({ word_limit: null, lock_version: 3 }), { timeout: 4000 })
    await screen.findByText("Saved")
  })

  test("a conflict keeps the unsaved text and offers a reload", async () => {
    server.use(
      ...editorHandlers(),
      http.patch(apiUrl("/v1/admission/essays/e1"), () =>
        HttpResponse.json(
          { type: "admission/conflict", title: "Conflict", status: 409, params: {} },
          { status: 409, headers: { "content-type": "application/problem+json" } },
        ),
      ),
    )
    renderAdmissionApp(<EssayEditor essay={essay} />)
    fireEvent.change(screen.getByLabelText("Essay text"), { target: { value: "Mine" } })
    await screen.findByText("The essay changed elsewhere", undefined, { timeout: 4000 })
    expect(screen.getByRole("button", { name: "Reload" })).toBeTruthy()
    expect((screen.getByLabelText("Essay text") as HTMLTextAreaElement).value).toBe("Mine")
  })

  test("a missing consent links to the settings", async () => {
    server.use(
      http.post(apiUrl("/v1/admission/essays/e1/coach/brainstorm"), () =>
        HttpResponse.json(
          { type: "admission/consent_required", title: "Consent", status: 403, params: {} },
          { status: 403, headers: { "content-type": "application/problem+json" } },
        ),
      ),
    )
    renderAdmissionApp(<CoachPanel essayId="e1" beforeRun={async () => 3} onUseOutline={() => {}} />)
    fireEvent.click(screen.getByRole("button", { name: /Brainstorm/ }))
    const link = await screen.findByRole("link", { name: "Open consent settings" })
    expect(link.getAttribute("href")).toMatch(/^\/settings\/?#consent$/)
  })

  test("the refine tab posts the action and passage", async () => {
    let body: unknown
    server.use(
      ...editorHandlers(),
      http.post(apiUrl("/v1/admission/essays/e1/coach/refine"), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ hints: ["Name the moment"] })
      }),
    )
    renderAdmissionApp(<EssayEditor essay={essay} />)
    fireEvent.click(await screen.findByRole("radio", { name: "Transition" }))
    fireEvent.change(screen.getByLabelText("Passage to refine"), { target: { value: "It began." } })
    fireEvent.click(screen.getByRole("button", { name: "Get hints" }))
    await screen.findByText("Name the moment")
    expect(body).toEqual({ action: "transition", text: "It began." })
  })

  test("the life story is read by the AI", async () => {
    server.use(
      http.post(apiUrl("/v1/admission/essay-life-story"), () =>
        HttpResponse.json({ drivers: ["Curiosity"], support: ["Physics"], leave_out: [], ideas: [] }),
      ),
    )
    renderAdmissionApp(<LifeStory />)
    fireEvent.change(screen.getByLabelText("Write freely about your life"), { target: { value: "I grew up." } })
    fireEvent.click(screen.getByRole("button", { name: "Find what drives me" }))
    await screen.findByText("Curiosity")
  })

  test("wordDiff marks inserted and deleted words", () => {
    const parts = wordDiff("the quick fox", "the slow fox") ?? []
    expect(parts.filter((p) => p.op === "del").map((p) => p.text.trim())).toEqual(["quick"])
    expect(parts.filter((p) => p.op === "add").map((p) => p.text.trim())).toEqual(["slow"])
  })
})

describe("essay ledger", () => {
  const prompt = {
    key: "p1",
    institution_id: "i1",
    institution_name: "MIT",
    position: 0,
    prompt: "Describe the world you come from.",
    word_limit: 250,
    limit_unit: "words",
    required: true,
    in_list: true,
  }
  const group = {
    key: "g1",
    label: "Your world",
    kind: "shared",
    spread: 0.2,
    covered: true,
    prompts: [prompt, { ...prompt, key: "p2", institution_id: "i2", institution_name: "KAIST", word_limit: 300 }],
    essay_ids: ["e1"],
    in_list_count: 2,
    due_utc: "2027-01-01T00:00:00Z",
    due_predicted: false,
  }
  const lonely = { ...group, key: "g2", label: "A unique one", kind: "unique", essay_ids: [], prompts: [{ ...prompt, key: "p3" }], due_utc: null }
  const written = { ...summary(essay), title: "Why physics", uniqueness: 72, deep_read: "fresh" as const }
  const scopes: string[] = []
  const base = () =>
    server.use(
      http.get(apiUrl("/v1/admission/essays"), () => HttpResponse.json({ items: [written] })),
      http.get(apiUrl("/v1/admission/list"), () => HttpResponse.json([])),
      http.get(apiUrl("/v1/admission/essay-ideas"), () => HttpResponse.json({ items: [] })),
      http.get(apiUrl("/v1/admission/exemplars"), () => HttpResponse.json({ items: [], total: 4 })),
      http.get(apiUrl("/v1/admission/essays/gallery"), () => HttpResponse.json({ items: [], mine: [] })),
      http.get(apiUrl("/v1/admission/essays/practice/today"), () =>
        HttpResponse.json({ day: "2026-11-21", theme: "Place", prompt: "Describe a street.", entry: null, streak: 3 }),
      ),
      http.get(apiUrl("/v1/admission/essays/match"), () => HttpResponse.json({ items: [] })),
      http.get(apiUrl("/v1/admission/essays/prompt-map"), ({ request }) => {
        scopes.push(new URL(request.url).searchParams.get("scope") ?? "")
        return HttpResponse.json({ available: true, model: "m", delta: 0.4, groups: [group, lonely] })
      }),
    )

  test("a row carries the group label, prompts, the started essay, the due date and its score", async () => {
    base()
    const view = renderAdmissionApp(<EssaysBody />)
    const rows = await screen.findByTestId("ledger-rows")
    const rowText = rows.textContent ?? ""
    expect(rowText).toContain("Your world")
    expect(screen.getByLabelText("MIT, KAIST")).toBeTruthy()
    expect(rowText).toContain("Why physics")
    expect(rowText).toContain("Describe the world you come from.")
    expect(rowText).toContain("Start")
    expect(rows.querySelectorAll("li").length).toBe(2)
    expect(screen.getByTestId("ledger-section-other").textContent).toContain("1/2")
    expect(screen.getByLabelText("Uniqueness 72 of 100")).toBeTruthy()
    const summaryText = screen.getByTestId("ledger-summary").textContent ?? ""
    expect(summaryText).toContain("2 essays needed")
    expect(summaryText).toContain("1 started")
    expect(summaryText).toContain("next deadline 1 Jan")
    await Bun.sleep(300)
    view.unmount()
  })

  test("the right panel shows the practice streak, the ideas and the example counts", async () => {
    base()
    const view = renderAdmissionApp(<EssaysBody />)
    await screen.findByTestId("ledger-rows")
    expect((await screen.findByTestId("practice-card")).textContent).toContain("3 days in a row")
    expect(screen.getByTestId("practice-card").textContent).toContain("Describe a street.")
    expect(screen.getByTestId("ideas-card").textContent).toContain("Ideas · 0")
    expect((await screen.findByTestId("examples-card")).textContent).toContain("4 admitted essays")
    await Bun.sleep(300)
    view.unmount()
  })

  test("the scope toggle asks the server for the whole catalog", async () => {
    base()
    scopes.length = 0
    const view = renderAdmissionApp(<EssaysBody />)
    await screen.findByTestId("ledger-rows")
    expect(scopes).toContain("list")
    fireEvent.click(screen.getByRole("button", { name: /^All/ }))
    await waitFor(() => expect(testRouter.replace).toHaveBeenCalledWith(expect.stringContaining("scope=all"), { scroll: false }))
    await Bun.sleep(300)
    view.unmount()
  })

  test("an old ?tab=ideas link opens the ideas drawer, which offers the life story while ideas stall", async () => {
    base()
    const view = renderAdmissionApp(<EssaysBody />, { route: "/essays/?tab=ideas" })
    await screen.findByTestId("ideas-stall")
    expect(screen.getByRole("dialog")).toBeTruthy()
    await Bun.sleep(300)
    view.unmount()
  })

  test("an old ?step=match link opens the university board", async () => {
    base()
    const view = renderAdmissionApp(<EssaysBody />, { route: "/essays/?step=match" })
    await screen.findByText("No universities on your list")
    expect(screen.queryByTestId("ledger-rows")).toBeNull()
    await Bun.sleep(300)
    view.unmount()
  })

  test("opening a row lists its prompts and starting an essay posts the group's prompts as targets", async () => {
    base()
    let body: { kind?: string; title?: string; word_limit?: number | null; targets?: unknown } | undefined
    server.use(
      http.post(apiUrl("/v1/admission/essays"), async ({ request }) => {
        body = (await request.json()) as typeof body
        return HttpResponse.json({ ...essay, id: "e7" }, { status: 201 })
      }),
    )
    const view = renderAdmissionApp(<EssaysBody />, { route: "/essays/?group=g2" })
    const drawer = await screen.findByTestId("group-drawer")
    expect(drawer.textContent).toContain("Describe the world you come from.")
    fireEvent.click(screen.getByRole("button", { name: "Start an essay" }))
    await waitFor(() => expect(testRouter.push).toHaveBeenCalledWith("/essays/edit/?id=e7"))
    expect(body).toMatchObject({ kind: "supplemental", title: "A unique one", targets: [{ institution_id: "i1", position: 0 }] })
    await Bun.sleep(300)
    view.unmount()
  })

  test("by university: a tap assigns a candidate essay to the slot", async () => {
    base()
    let put: unknown
    const slot: MatchSlot = {
      slot: "supp1",
      prompt: "Why us?",
      word_limit: 250,
      required: true,
      essay_id: null,
      assigned: null,
      candidates: [{ essay_id: "e1", title: "Why physics", kind: "supplemental", word_count: 200, alignment: 80, target_match: true }],
    }
    const table = { institution_id: "i1", institution_name: "MIT", due_utc: null, due_predicted: false, slots: [slot] }
    let current = table
    server.use(
      http.get(apiUrl("/v1/admission/essays/match"), () => HttpResponse.json({ items: [current] })),
      http.put(apiUrl("/v1/admission/essays/match/i1/slots/supp1"), async ({ request }) => {
        put = await request.json()
        const assigned = { essay_id: "e1", kind: "supplemental", over_limit: false, status: "draft", title: "Why physics", word_count: 200 }
        current = { ...table, slots: [{ ...slot, essay_id: "e1", assigned }] }
        return HttpResponse.json(current)
      }),
    )
    const view = renderAdmissionApp(<EssaysBody />, { route: "/essays/?lens=uni" })
    const cell = await screen.findByTestId("slot-i1-supp1")
    expect(cell.textContent).toContain("Why us?")
    fireEvent.click(within(cell).getByRole("button", { name: /Choose an essay/ }))
    const dialog = await screen.findByRole("dialog")
    fireEvent.click(within(dialog).getByRole("button", { name: /Why physics/ }))
    await waitFor(() => expect(put).toEqual({ essay_id: "e1" }))
    await waitFor(() => expect(screen.getByTestId("slot-i1-supp1").textContent).toContain("Why physics"))
    await Bun.sleep(300)
    view.unmount()
  })

  test("the next step links to the documents and keeps the entry", async () => {
    base()
    const view = renderAdmissionApp(<EssaysBody />, { route: "/essays/?entry=e9" })
    const link = await screen.findByRole("link", { name: "Check application requirements" })
    expect(link.getAttribute("href")).toBe("/documents?entry=e9")
    await Bun.sleep(300)
    view.unmount()
  })
})
