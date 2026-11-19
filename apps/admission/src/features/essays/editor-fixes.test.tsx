import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import { PromptCarousel } from "./components/prompt-carousel"
import { SuppPrompts } from "./components/supp-prompts"

describe("essay editor fixes", () => {
  test("ADM-EDITOR-1: no prompts offers the college page and an own-prompt supplemental essay", async () => {
    let body: unknown = null
    server.use(
      http.get(apiUrl("/v1/admission/catalog/institutions/i2/supp-prompts"), () => HttpResponse.json([])),
      http.post(apiUrl("/v1/admission/essays"), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ id: "e5" })
      }),
    )
    renderAdmissionApp(<SuppPrompts institutionId="i2" listEntryId="l1" college="X" />)
    expect(await screen.findByText("No prompts on file for this college yet")).toBeTruthy()
    expect(screen.getByRole("link", { name: "Open the college page" })).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Add the prompt yourself" }))
    fireEvent.change(screen.getByLabelText("Your prompt"), { target: { value: "Why us?" } })
    fireEvent.click(screen.getByRole("button", { name: "Start essay" }))
    await waitFor(() =>
      expect(body).toMatchObject({ kind: "supplemental", prompt_text: "Why us?", list_entry_id: "l1" }),
    )
  })

  test("ADM-EDITOR-2: a supplemental essay is offered only the college's prompts, never Common App ones", async () => {
    server.use(
      http.get(apiUrl("/v1/admission/catalog/institutions/i1/supp-prompts"), () =>
        HttpResponse.json([
          {
            cycle: "2026-27",
            prompts: [
              {
                position: 1,
                prompt: "Why our college today?",
                word_limit: 250,
                required: true,
                source_url: null,
                status: "same",
                previous_text: null,
              },
            ],
          },
        ]),
      ),
      http.get(apiUrl("/v1/admission/catalog/institutions/none/supp-prompts"), () => HttpResponse.json([])),
    )
    const picked: string[] = []
    const { unmount } = renderAdmissionApp(<PromptCarousel supplementalFor="i1" onPick={(p) => picked.push(p)} />)
    fireEvent.click(await screen.findByRole("button", { name: "Use this prompt" }))
    expect(picked).toEqual(["Why our college today?"])
    unmount()
    renderAdmissionApp(<PromptCarousel supplementalFor={null} onPick={() => {}} />)
    expect(screen.queryByRole("button", { name: "Use this prompt" })).toBeNull()
  })

  test("ADM-EDITOR-3: personal essays still get the Common App prompts", () => {
    renderAdmissionApp(<PromptCarousel onPick={() => {}} />)
    expect(screen.getByRole("button", { name: "Use this prompt" })).toBeTruthy()
  })
})
