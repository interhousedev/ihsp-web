/** Caseload filters, saved views and the comment visibility toggle. */
import { describe, expect, it } from "bun:test"
import { apiUrl, server, testRouter, userMe } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { CommentsPanel } from "../features/comments/components/comments-panel"
import { CaseloadContent, CaseloadPage } from "../features/staff/components/caseload-page"
import { renderAdmissionApp } from "./helpers"

const counselor = { session: { user: { ...userMe, roles: ["counselor" as const] } } }
const studentId = "11111111-1111-4111-8111-111111111111"

const item = (over: object = {}) => ({
  student_id: studentId,
  stage: "words",
  group_id: "g1",
  group_name: "11A",
  overdue: 0,
  open_help: 0,
  next_due: null,
  limited: false,
  ...over,
})

function caseloadHandlers(seen: URLSearchParams[], items = [item()]) {
  return [
    http.get(apiUrl("/v1/admission/staff/students"), ({ request }) => {
      const params = new URL(request.url).searchParams
      seen.push(params)
      const stage = params.get("stage")
      return HttpResponse.json({ items: stage && stage !== "words" ? [] : items })
    }),
    http.get(apiUrl("/v1/admission/staff/saved-views"), () => HttpResponse.json({ items: [] })),
    http.get(apiUrl("/v1/admission/config"), () => HttpResponse.json({})),
  ]
}

describe("caseload filters", () => {
  it("sends the risk and deadline filters as query parameters", async () => {
    const seen: URLSearchParams[] = []
    server.use(...caseloadHandlers(seen))
    renderAdmissionApp(<CaseloadContent />, counselor)
    await screen.findByText(/11A/)

    await userEvent.click(screen.getByRole("switch", { name: "At risk only" }))
    await waitFor(() => expect(seen.some((p) => p.get("risk") === "true")).toBe(true))

    fireEvent.change(screen.getByLabelText("Deadline before"), { target: { value: "2026-03-01" } })
    await waitFor(() => expect(seen.some((p) => p.get("deadline_before")?.startsWith("2026-03-01"))).toBe(true))
  })

  it("shows the filtered empty state and clears the filters", async () => {
    const seen: URLSearchParams[] = []
    server.use(
      http.get(apiUrl("/v1/admission/staff/students"), ({ request }) => {
        const params = new URL(request.url).searchParams
        seen.push(params)
        return HttpResponse.json({ items: params.get("risk") ? [] : [item()] })
      }),
      http.get(apiUrl("/v1/admission/staff/saved-views"), () => HttpResponse.json({ items: [] })),
      http.get(apiUrl("/v1/admission/config"), () => HttpResponse.json({})),
    )
    renderAdmissionApp(<CaseloadContent />, counselor)
    await screen.findByText(/11A/)
    await userEvent.click(screen.getByRole("switch", { name: "At risk only" }))
    await waitFor(() => expect(screen.queryByText(/11A/)).toBeNull())
    await userEvent.click(screen.getByRole("button", { name: "Clear filters" }))
    expect(await screen.findByText(/11A/)).toBeInTheDocument()
  })

  it("applies a saved view and shows the limit message on a 422", async () => {
    const seen: URLSearchParams[] = []
    server.use(
      http.get(apiUrl("/v1/admission/staff/saved-views"), () =>
        HttpResponse.json({
          items: [{ id: "v1", name: "Risky", filters: { risk: true }, sort: null, is_default: false, lock_version: 1 }],
        }),
      ),
      http.post(apiUrl("/v1/admission/staff/saved-views"), () =>
        HttpResponse.json(
          { type: "admission/saved_view_limit", title: "Too many", status: 422, params: { limit: 3 } },
          { status: 422, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
      ...caseloadHandlers(seen),
    )
    renderAdmissionApp(<CaseloadContent />, counselor)
    await userEvent.click(await screen.findByRole("button", { name: "Risky" }))
    await waitFor(() => expect(seen.some((p) => p.get("risk") === "true")).toBe(true))

    await userEvent.click(screen.getByRole("button", { name: "Save current filters" }))
    await userEvent.type(screen.getByLabelText("View name"), "Another")
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(await screen.findByText("You can keep at most 3 saved views.")).toBeInTheDocument()
  })
})

describe("comment visibility", () => {
  const target = { studentId, kind: "profile", id: studentId }

  async function post(toggle: boolean) {
    let body: Record<string, unknown> = {}
    server.use(
      http.get(apiUrl("/v1/admission/comments"), () => HttpResponse.json({ items: [] })),
      http.post(apiUrl("/v1/admission/comments"), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ id: "c1", ...body }, { status: 201 })
      }),
    )
    renderAdmissionApp(<CommentsPanel target={target} />, counselor)
    await userEvent.type(await screen.findByRole("textbox"), "Hello")
    if (toggle) await userEvent.click(screen.getByRole("switch", { name: "Staff only" }))
    await userEvent.click(screen.getByRole("button", { name: "Send" }))
    await waitFor(() => expect(body.body).toBe("Hello"))
    return body
  }

  it("is visible to the student by default", async () => {
    expect((await post(false)).visibility).toBe("student_and_staff")
  })

  it("is staff-only once the switch is on", async () => {
    const sent = await post(true)
    expect(sent.visibility).toBe("staff_only")
    expect(sent.student_id).toBe(studentId)
  })

  it("labels listed comments by visibility", async () => {
    server.use(
      http.get(apiUrl("/v1/admission/comments"), () =>
        HttpResponse.json({
          items: [
            {
              id: "a",
              student_id: studentId,
              author_id: "x",
              body: "private",
              visibility: "staff_only",
              created_at: "2026-01-01T00:00:00Z",
            },
            {
              id: "b",
              student_id: studentId,
              author_id: "x",
              body: "shared",
              visibility: "student_and_staff",
              created_at: "2026-01-01T00:00:00Z",
            },
          ],
        }),
      ),
    )
    renderAdmissionApp(<CommentsPanel target={target} />, counselor)
    const pills = await screen.findAllByTestId("comment-visibility")
    expect(pills.map((p) => p.textContent)).toEqual(["Staff only", "Visible to the student"])
  })
})

describe("caseload page", () => {
  it("sends a transcript officer to the transcripts queue", async () => {
    renderAdmissionApp(<CaseloadPage />, {
      session: { user: { ...userMe, roles: ["transcript_officer" as const] } },
    })
    await waitFor(() => expect(testRouter.replace).toHaveBeenCalledWith("/staff/transcripts/"))
  })
})
