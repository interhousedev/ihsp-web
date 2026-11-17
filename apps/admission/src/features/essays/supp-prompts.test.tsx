import { apiUrl, server, testRouter } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import type { SuppCycle } from "./api"
import { SuppPrompts } from "./components/supp-prompts"

const prompt = (position: number, text: string, status: string, previous: string | null = null) => ({
  position,
  prompt: text,
  word_limit: 250,
  required: true,
  source_url: null,
  status,
  previous_text: previous,
})

const cycles = [
  {
    cycle: "2026-27",
    prompts: [
      prompt(1, "Why our college today?", "changed", "Why our college?"),
      prompt(2, "Describe a community.", "same"),
      prompt(3, "A brand new question.", "new"),
      prompt(4, "An old question.", "removed"),
    ],
  },
  { cycle: "2025-26", prompts: [prompt(1, "Why our college?", "same")] },
] as unknown as SuppCycle[]

describe("supplemental prompts panel", () => {
  test("shows this year's prompts, the changes and starts an essay from a prompt", async () => {
    let body: unknown = null
    server.use(
      http.get(apiUrl("/v1/admission/catalog/institutions/i1/supp-prompts"), () => HttpResponse.json(cycles)),
      http.post(apiUrl("/v1/admission/essays"), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ id: "e9" })
      }),
    )
    renderAdmissionApp(<SuppPrompts institutionId="i1" listEntryId="l1" college="Test University" />)
    expect(await screen.findByText("This year's prompts (2026-27)")).toBeTruthy()
    expect(screen.getByText("Changes since last year")).toBeTruthy()
    for (const label of ["New", "Changed", "Same", "Removed"]) expect(screen.getByText(label)).toBeTruthy()
    expect(screen.getAllByRole("button", { name: "Start essay" })).toHaveLength(3)
    fireEvent.click(screen.getAllByRole("button", { name: "Start essay" })[0]!)
    await waitFor(() =>
      expect(body).toEqual({
        kind: "supplemental",
        title: "Supp letter for Test University",
        prompt_text: "Why our college today?",
        word_limit: 250,
        list_entry_id: "l1",
      }),
    )
    await waitFor(() => expect(testRouter.push).toHaveBeenCalledWith("/essays/edit/?id=e9"))
  })

  test("says when no prompts are on file", async () => {
    server.use(http.get(apiUrl("/v1/admission/catalog/institutions/i2/supp-prompts"), () => HttpResponse.json([])))
    renderAdmissionApp(<SuppPrompts institutionId="i2" listEntryId="l1" college="X" />)
    expect(await screen.findByText("No prompts on file for this college yet")).toBeTruthy()
  })
})
