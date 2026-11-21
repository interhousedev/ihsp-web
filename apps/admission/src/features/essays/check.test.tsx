import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import { CheckPanel } from "./components/check-panel"
import { CoachPanel } from "./components/coach-panel"
import { EssayMeta } from "./components/essay-meta"

const DIMS = ["hook", "theme", "detail", "authenticity", "reflection", "writing"]

const result = {
  score: 72,
  band: "strong",
  dimensions: DIMS.map((dim, i) => ({
    dim,
    score: 3,
    quote: i === 0 ? "A quoted line" : null,
    comment: `Comment ${dim}`,
  })),
  prompt_fit: "partial",
  prompt_fit_reason: "Drifts from the prompt",
  strongest: "Vivid opening",
  first_fix: "Cut the middle",
  flagged_paragraph: 2,
  flagged_text: "Flagged paragraph text",
  flagged_reason: "Too generic",
  summary: "ok",
  word_count: 700,
  word_limit: 650,
  over_limit: true,
  generic: true,
}

describe("essay check", () => {
  test("runs the check and shows the result", async () => {
    server.use(http.post(apiUrl("/v1/admission/essays/e1/coach/check"), () => HttpResponse.json(result)))
    renderAdmissionApp(<CheckPanel essayId="e1" beforeRun={async () => {}} />)
    fireEvent.click(await screen.findByRole("button", { name: "Check essay" }))
    await screen.findByTestId("check-result")
    expect(screen.getByText("72")).toBeTruthy()
    expect(screen.getByText("Drifts from the prompt")).toBeTruthy()
    expect(screen.getByText("A quoted line")).toBeTruthy()
    expect(screen.getByText("Flagged paragraph text")).toBeTruthy()
    expect(screen.getByText("Vivid opening")).toBeTruthy()
    expect(screen.getByText("Cut the middle")).toBeTruthy()
    await Bun.sleep(300)
  })

  test("a too-short essay shows the minimum", async () => {
    server.use(
      http.post(apiUrl("/v1/admission/essays/e1/coach/check"), () =>
        HttpResponse.json(
          { type: "admission/essay_too_short", title: "Short", status: 422, params: { min: 50, count: 7 } },
          { status: 422, headers: { "content-type": "application/problem+json" } },
        ),
      ),
    )
    renderAdmissionApp(<CheckPanel essayId="e1" beforeRun={async () => {}} />)
    fireEvent.click(await screen.findByRole("button", { name: "Check essay" }))
    await screen.findByText("Write at least 50 words to check this essay (now 7)")
  })
})

describe("essay meta", () => {
  test("warns over the limit and toggles the prompt", async () => {
    renderAdmissionApp(
      <EssayMeta prompt="Tell us" wordLimit={5} words={9} onPrompt={() => {}} onWordLimit={() => {}} />,
    )
    const count = screen.getByTestId("essay-meta-count")
    expect(count.textContent).toContain("9 / 5")
    expect(count.className).toContain("text-warning")
    expect(document.getElementById("essay-prompt-edit")).toBeNull()
    const toggle = document.querySelector("[aria-expanded]") as HTMLElement
    fireEvent.click(toggle)
    await waitFor(() => expect(document.getElementById("essay-prompt-edit")).not.toBeNull())
  })
})

describe("essay coach locale", () => {
  test("the check sends the UI locale in Accept-Language", async () => {
    let lang: string | null = null
    server.use(
      http.post(apiUrl("/v1/admission/essays/e1/coach/check"), ({ request }) => {
        lang = request.headers.get("Accept-Language")
        return HttpResponse.json(result)
      }),
    )
    renderAdmissionApp(<CheckPanel essayId="e1" beforeRun={async () => {}} />, { locale: "ru" })
    fireEvent.click(await screen.findByRole("button", { name: "Check essay" }))
    await screen.findByTestId("check-result")
    expect(lang === null ? null : (lang as string).slice(0, 2)).toBe("ru")
    await Bun.sleep(300)
  })

  test("the brainstorm coach sends the UI locale in Accept-Language", async () => {
    let lang: string | null = null
    server.use(
      http.post(apiUrl("/v1/admission/essays/e1/coach/brainstorm"), ({ request }) => {
        lang = request.headers.get("Accept-Language")
        return HttpResponse.json({ questions: ["Q1"] })
      }),
    )
    renderAdmissionApp(<CoachPanel essayId="e1" beforeRun={async () => {}} onUseOutline={() => {}} />, {
      locale: "ru",
    })
    fireEvent.click(await screen.findByRole("button", { name: "Brainstorm" }))
    await waitFor(() => expect(lang).not.toBeNull())
    expect((lang as unknown as string).slice(0, 2)).toBe("ru")
  })
})
