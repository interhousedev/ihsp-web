import { apiUrl, server, testRouter } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../../../tests/helpers"
import type { Essay, EssaySummary } from "../../api"
import { EssayEditor } from "../essay-editor"

const A = "/v1/admission"

const essay: Essay = {
  id: "e1",
  kind: "personal_statement",
  title: "Why physics",
  prompt_text: "Describe a challenge",
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
const summary = ({ body: _b, notes: _n, plan: _p, links: _l, ...rest }: Essay): EssaySummary => ({
  ...rest,
  uniqueness: null,
  deep_read: "none",
  deep_read_at: null,
})
const supp: EssaySummary = { ...summary(essay), id: "e2", kind: "supplemental", title: "Supplement" }

const read = {
  paragraphs: [
    { paragraph: 1, role: "hook", reveals: "Opens on a number", strength: "strong" },
    { paragraph: 2, role: "close", reveals: "Ends on a shrug", strength: "weak" },
  ],
  uniqueness: 72,
  uniqueness_note: "Specific voice",
  tropes: [],
  moments: [{ paragraph: 2, quote: "three  FOUR", kind: "fresh" }],
  fix_paragraph: 2,
  fix_dimension: "insight",
  fix_problem: "No reflection",
  fix_try: "Say what changed",
}
const withBody = { ...essay, body: "One two\n\nThree four" }
const deepRead = (stale: boolean) =>
  http.get(apiUrl(`${A}/essays/e1/deep-read`), () => HttpResponse.json({ read, cached: true, stale }))

const handlers = () => [
  http.get(apiUrl(`${A}/essays/e1/deep-read`), () => HttpResponse.json({ read: null, cached: false, stale: false })),
  http.get(apiUrl(`${A}/essays`), () => HttpResponse.json({ items: [summary(essay), supp] })),
  http.get(apiUrl(`${A}/essays/e1`), () => HttpResponse.json(essay)),
  http.get(apiUrl(`${A}/essays/e1/reviews`), () =>
    HttpResponse.json({ base: null, base_cached: false, base_stale: false, universities: [] }),
  ),
  http.get(apiUrl(`${A}/essays/e1/invites`), () => HttpResponse.json({ items: [] })),
]

describe("essay editor shell", () => {
  test("editing the title saves it", async () => {
    let body: Record<string, unknown> | undefined
    server.use(
      ...handlers(),
      http.patch(apiUrl(`${A}/essays/e1`), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ ...essay, title: "Why math", lock_version: 4 })
      }),
    )
    renderAdmissionApp(<EssayEditor essay={essay} />)
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Why math" } })
    await waitFor(() => expect(body).toMatchObject({ title: "Why math", lock_version: 3 }), { timeout: 4000 })
    await screen.findByText("Saved")
  })

  test("comments list the guest feedback", async () => {
    server.use(
      ...handlers(),
      http.get(apiUrl(`${A}/essays/e1/feedback`), () =>
        HttpResponse.json({
          items: [
            {
              id: "f1",
              author_name: "Aziza",
              body: "Lovely opening",
              quote: "One two",
              detached: false,
              mine: false,
              parent_id: null,
              invite_label: null,
              audience: "classmate",
              created_at: "2026-01-02T10:00:00Z",
              resolved_at: null,
            },
          ],
        }),
      ),
    )
    renderAdmissionApp(<EssayEditor essay={essay} />)
    fireEvent.click(screen.getByRole("button", { name: "Comments" }))
    await screen.findByText("Lovely opening")
    expect(screen.getByText("Aziza")).toBeTruthy()
  })

  test("Share opens the share dialog", async () => {
    server.use(...handlers())
    renderAdmissionApp(<EssayEditor essay={essay} />)
    fireEvent.click(screen.getByRole("button", { name: "Share" }))
    await screen.findByRole("dialog")
  })

  test("the side has the four tabs and Universities shows the fit and the prompts", async () => {
    server.use(
      http.get(apiUrl(`${A}/essays/e1/reviews`), () =>
        HttpResponse.json({
          base: null,
          base_cached: false,
          base_stale: false,
          universities: [
            {
              institution_id: "i1",
              name: "MIT",
              cached: true,
              stale: false,
              review: { alignment: 81, fit_summary: "Builder voice", goals: [], risks: [], sourced: true, supplement_tips: [] },
            },
          ],
        }),
      ),
      http.get(apiUrl(`${A}/essays/prompt-map`), () => HttpResponse.json({ groups: [] })),
      ...handlers(),
    )
    renderAdmissionApp(<EssayEditor essay={essay} />)
    for (const name of ["Read", "Universities", "Examples", "Ideas"]) {
      expect(screen.getByRole("tab", { name })).toBeTruthy()
    }
    // The chip in the header and the card in the tab carry the same fit.
    await screen.findByText("81")
    fireEvent.click(screen.getByRole("tab", { name: "Universities" }))
    await screen.findByText("Builder voice")
  })

  test("a deep read lays moments on the text and lists paragraphs", async () => {
    server.use(deepRead(false), ...handlers())
    renderAdmissionApp(<EssayEditor essay={withBody} />)
    await screen.findByText("Opens on a number")
    const mark = document.querySelector("mark[data-moment]")
    expect(mark?.textContent).toBe("Three four")
    expect(screen.queryByTestId("editor-stale-banner")).toBeNull()
    // The score sits in the header as the one number.
    expect(screen.getByTestId("score-bar").textContent).toContain("72")
  })

  test("editing after the read shows the stale banner; a server-stale read shows it at once", async () => {
    server.use(deepRead(false), ...handlers())
    const { unmount } = renderAdmissionApp(<EssayEditor essay={withBody} />)
    await screen.findByText("Opens on a number")
    fireEvent.change(screen.getByLabelText("Essay text"), { target: { value: "One two\n\nThree four five" } })
    await screen.findByTestId("editor-stale-banner")
    unmount()
    server.use(deepRead(true), ...handlers())
    renderAdmissionApp(<EssayEditor essay={withBody} />)
    await screen.findByTestId("editor-stale-banner")
  })
})
