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
const summary = ({ body: _b, notes: _n, plan: _p, links: _l, ...rest }: Essay): EssaySummary => rest
const supp: EssaySummary = { ...summary(essay), id: "e2", kind: "supplemental", title: "Supplement" }

const handlers = () => [
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

  test("the document tabs switch between essays", async () => {
    server.use(...handlers())
    renderAdmissionApp(<EssayEditor essay={essay} />)
    const other = await screen.findByRole("button", { name: /Supplement/ })
    fireEvent.click(other)
    expect(testRouter.push).toHaveBeenCalledWith("/essays/edit/?id=e2")
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
})
