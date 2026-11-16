/** AI prompts (admin): the slots by task, a saved new version, an activated old one, the analytics table. */
import { describe, expect, test } from "bun:test"
import type { PromptBody, PromptDetail, PromptVersion } from "@ihsp/api"
import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { PromptsPage } from "../features/prompts/components/prompts-page"
import { configureTests, renderAdmin, setValue, waitUntil } from "./helpers"

configureTests()

const version = (n: number, text: string, active: boolean): PromptVersion => ({
  id: `00000000-0000-4000-8000-00000000000${n}`,
  version: n,
  locale: "",
  text,
  hash: `h${n}`,
  active,
  created_at: "2026-11-10T08:00:00Z",
  created_by: null,
  note: n === 1 ? "first" : "",
})

const detail: PromptDetail = {
  task: "essay_review",
  name: "system",
  summary: "The reviewer's instructions",
  template: false,
  placeholders: [],
  locale: "",
  text: "Be kind.\nBe brief.",
  builtin: "Be kind.",
  hash: "h2",
  version: 2,
  versions: [version(2, "Be kind.\nBe brief.", true), version(1, "Be kind.", false)],
}

function useHandlers() {
  server.use(
    http.get(apiUrl("/v1/admin/ai/prompts"), () =>
      HttpResponse.json({
        items: [
          {
            task: "essay_review",
            name: "system",
            summary: "The reviewer's instructions",
            template: false,
            placeholders: [],
            overridden: true,
            active: [],
          },
          {
            task: "goal_plan",
            name: "system",
            summary: "Goal plans",
            template: false,
            placeholders: [],
            overridden: false,
            active: [],
          },
        ],
      }),
    ),
    http.get(apiUrl("/v1/admin/ai/prompts/analytics"), () =>
      HttpResponse.json({
        from: "2026-10-18",
        to: "2026-11-16",
        items: [
          {
            task: "essay_review",
            version: 2,
            calls: 12,
            input_tokens: 1000,
            output_tokens: 500,
            cost_usd: 0.25,
            error_rate: 0.1,
            p50_ms: 10,
            p95_ms: 20,
            rating_average: null,
            ratings: 0,
          },
        ],
      }),
    ),
    http.get(apiUrl("/v1/admin/ai/prompts/essay_review/system"), () => HttpResponse.json(detail)),
  )
}

describe("prompts", () => {
  test("lists the slots by task and the analytics per version", async () => {
    useHandlers()
    renderAdmin(<PromptsPage />, { route: "/prompts/" })

    expect(await screen.findByRole("heading", { name: "essay_review" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "goal_plan" })).toBeInTheDocument()
    expect(screen.getByText("Edited")).toBeInTheDocument()
    expect(await screen.findByText("v2")).toBeInTheDocument()
    expect(screen.getByText("$0.25")).toBeInTheDocument()
    expect(screen.getByText("10%")).toBeInTheDocument()
  })

  test("saving an edit stores a new version and shows the diff", async () => {
    useHandlers()
    const sent: PromptBody[] = []
    server.use(
      http.put(apiUrl("/v1/admin/ai/prompts/essay_review/system"), async ({ request }) => {
        sent.push((await request.json()) as PromptBody)
        return HttpResponse.json(version(3, "Be kind and brief.", true))
      }),
    )
    renderAdmin(<PromptsPage />, { route: "/prompts/?slot=essay_review%2Fsystem" })

    const text = await screen.findByLabelText("Prompt text")
    expect(await screen.findByText("+ Be brief.")).toBeInTheDocument()
    setValue(text, "Be kind and brief.")
    setValue(screen.getByLabelText("Note (optional)"), "merge")
    fireEvent.click(screen.getByRole("button", { name: "Save as new version" }))

    await waitUntil(() => sent.length === 1)
    expect(sent[0]).toEqual({ text: "Be kind and brief.", note: "merge", locale: "" })
  })

  test("an older version is activated", async () => {
    useHandlers()
    const activated: string[] = []
    server.use(
      http.post(apiUrl("/v1/admin/ai/prompts/essay_review/system/versions/:version/activate"), ({ params }) => {
        activated.push(String(params.version))
        return HttpResponse.json(version(1, "Be kind.", true))
      }),
    )
    renderAdmin(<PromptsPage />, { route: "/prompts/?slot=essay_review%2Fsystem" })

    fireEvent.click(await screen.findByRole("button", { name: "Activate version 1" }))

    await waitUntil(() => activated.length === 1)
    expect(activated).toEqual(["1"])
  })
})
