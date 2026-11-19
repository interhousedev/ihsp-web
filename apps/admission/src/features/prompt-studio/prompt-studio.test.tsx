import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import { PromptStudioBody } from "./components/prompt-studio-page"

const A = "/v1/admission/staff/prompt-studio/slots"
const slot = {
  task: "essay_review",
  name: "system",
  summary: "Reviewer system prompt",
  template: false,
  fields: ["essay"],
  builtin: "Built-in text",
  active_text: "Be fair.",
  active_version: 2,
  active_hash: "h",
  versions: [
    { version: 2, locale: "", text: "Be fair.", hash: "h", active: true, note: "", created_at: "2026-01-01T00:00:00Z" },
  ],
}
const handlers = () => [
  http.get(apiUrl(A), () => HttpResponse.json({ items: [slot] })),
  http.get(apiUrl("/v1/admission/staff/exemplars"), () => HttpResponse.json({ items: [], total: 0 })),
]

describe("prompt studio", () => {
  test("a rejected draft shows its blocking codes inline", async () => {
    server.use(
      ...handlers(),
      http.put(apiUrl(`${A}/essay_review/system`), () =>
        HttpResponse.json(
          {
            type: "validation/failed",
            title: "Invalid",
            status: 422,
            params: { field: "text", issues: ["bad_format"] },
          },
          { status: 422 },
        ),
      ),
    )
    renderAdmissionApp(<PromptStudioBody />)
    const box = (await screen.findByDisplayValue("Be fair.")) as HTMLTextAreaElement
    fireEvent.change(box, { target: { value: "Oops {" } })
    fireEvent.click(
      screen.getAllByRole("button").find((b) => b.textContent?.match(/publish|Publish/)) ??
        screen.getAllByRole("button")[0]!,
    )
    await waitFor(() => expect(box.getAttribute("aria-invalid")).toBe("true"))
  })

  test("a test run renders both reviews and the limit is shown", async () => {
    server.use(
      ...handlers(),
      http.post(apiUrl(`${A}/essay_review/system/test`), () =>
        HttpResponse.json({
          warnings: [],
          results: [
            {
              label: "Sample 1",
              exemplar_id: null,
              active: { model: "m", output: { score: 70 } },
              draft: { model: "m", output: { score: 75 } },
              delta: { score_delta: 5, band_before: "B", band_after: "A", band_changed: true },
            },
          ],
        }),
      ),
    )
    renderAdmissionApp(<PromptStudioBody />)
    await screen.findByDisplayValue("Be fair.")
    expect(screen.getByText(/30 test runs|promptStudio\.limit/)).toBeTruthy()
    const samples = document.querySelectorAll("textarea")
    fireEvent.change(samples[1]!, { target: { value: "My essay" } })
    const run = screen
      .getAllByRole("button")
      .find((b) => !b.hasAttribute("disabled") && /run|Run/.test(b.textContent ?? ""))
    fireEvent.click(run!)
    const results = await screen.findByTestId("studio-results")
    expect(results.textContent).toContain('"score": 75')
  })
})
