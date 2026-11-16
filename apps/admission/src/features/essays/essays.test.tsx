import { apiUrl, server, testRouter } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import type { Essay, EssaySummary } from "./api"
import { CoachPanel } from "./components/coach-panel"
import { EssayEditor } from "./components/essay-editor"
import { EssaysBody } from "./components/essays-page"
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
  updated_at: "2026-01-01T00:00:00Z",
}

const summary = ({ body: _b, notes: _n, plan: _p, links: _l, ...rest }: Essay): EssaySummary => rest

const editorHandlers = () => [
  http.get(apiUrl("/v1/admission/me/items"), () => HttpResponse.json({ items: [], next_cursor: null })),
  http.get(apiUrl("/v1/admission/essays/e1"), () => HttpResponse.json(essay)),
  http.get(apiUrl("/v1/admission/me/profile"), () => HttpResponse.json({ answers: {} })),
]

describe("essays", () => {
  test("lists essays and creates one", async () => {
    let body: unknown
    server.use(
      http.get(apiUrl("/v1/admission/essays"), () => HttpResponse.json({ items: [summary(essay)] })),
      http.get(apiUrl("/v1/admission/essay-ideas"), () => HttpResponse.json({ items: [] })),
      http.get(apiUrl("/v1/admission/list"), () => HttpResponse.json({ items: [] })),
      http.post(apiUrl("/v1/admission/essays"), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ ...essay, id: "e2", title: "Community" }, { status: 201 })
      }),
    )
    renderAdmissionApp(<EssaysBody />)
    await screen.findByText("Why physics")
    fireEvent.click(screen.getByRole("button", { name: "New essay" }))
    fireEvent.change(await screen.findByLabelText("Title"), { target: { value: "Community" } })
    fireEvent.click(screen.getByRole("button", { name: "Create" }))
    await waitFor(() => expect(body).toMatchObject({ kind: "personal_statement", title: "Community" }))
    await waitFor(() => expect(testRouter.push).toHaveBeenCalled())
    // Let the Reveal fade-in finish; happy-dom rejects a cancelled animation during the next test's cleanup.
    await Bun.sleep(300)
  })

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

  test("wordDiff marks inserted and deleted words", () => {
    const parts = wordDiff("the quick fox", "the slow fox") ?? []
    expect(parts.filter((p) => p.op === "del").map((p) => p.text.trim())).toEqual(["quick"])
    expect(parts.filter((p) => p.op === "add").map((p) => p.text.trim())).toEqual(["slow"])
  })
})
