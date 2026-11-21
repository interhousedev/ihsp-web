/** AI harness (admin): connectors, pipelines, request registry with prompt diff, analytics tables. */
import { describe, expect, test } from "bun:test"
import type { PromptDetail } from "@ihsp/api"
import { aiPipelinesFixture, apiUrl, selectDropdownValue, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { AnalyticsPage } from "../features/ai-harness/components/analytics-page"
import { ConnectorsPage } from "../features/ai-harness/components/connectors-page"
import { PipelinesPage } from "../features/ai-harness/components/pipelines-page"
import { RequestsPage } from "../features/ai-harness/components/requests-page"
import { PromptHistory } from "../features/prompts/components/prompt-history"
import { micro } from "../features/ai-harness/utils"
import { configureTests, renderAdmin, setValue, waitUntil } from "./helpers"

configureTests()

describe("micro-USD formatting", () => {
  test("converts millionths of a dollar", () => {
    expect(micro(1_250_000, "en")).toBe("$1.25")
    expect(micro(530, "en")).toBe("$0.0005")
    expect(micro(0, "en")).toBe("$0.00")
  })
})

describe("connectors", () => {
  test("lists connectors without secrets, tests one and adds one with a write-only key", async () => {
    let posted: Record<string, unknown> | null = null
    server.use(
      http.post(apiUrl("/v1/admin/ai/connectors"), async ({ request }) => {
        posted = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(
          { ...posted, enabled: true, has_secret: true, secret_last4: "cret", builtin: false, source: "db" },
          { status: 201 },
        )
      }),
    )
    renderAdmin(<ConnectorsPage />)
    expect((await screen.findAllByText("OpenRouter")).length).toBeGreaterThan(0)
    expect(screen.getByText("…a1b2")).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: "Test OpenRouter" }))
    expect(await screen.findByText("Works · 412 ms")).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: "Add connector" }))
    const dialog = await screen.findByRole("dialog")
    setValue(within(dialog).getByLabelText(/^Id/), "groq")
    setValue(within(dialog).getByLabelText(/^Title/), "Groq")
    setValue(within(dialog).getByLabelText(/^Base URL/), "https://api.groq.com/openai/v1")
    const key = within(dialog).getByLabelText(/^API key/) as HTMLInputElement
    expect(key.type).toBe("password")
    setValue(key, "secret")
    fireEvent.click(within(dialog).getByRole("button", { name: "Add" }))
    await waitUntil(() => posted !== null)
    expect(posted).toMatchObject({ id: "groq", kind: "openai_compatible", api_key: "secret" })
  })

  test("removing asks first, then deletes", async () => {
    let deleted = ""
    server.use(
      http.delete(apiUrl("/v1/admin/ai/connectors/:id"), ({ params }) => {
        deleted = String(params.id)
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderAdmin(<ConnectorsPage />)
    fireEvent.click(await screen.findByRole("button", { name: "Remove Exa" }))
    expect(deleted).toBe("")
    fireEvent.click(await screen.findByRole("button", { name: "Remove" }))
    await waitUntil(() => deleted === "exa")
  })
})

describe("pipelines", () => {
  test("shows the effective route, saves a runtime route and resets it", async () => {
    let put = null as Record<string, unknown> | null
    let reset = false
    server.use(
      http.get(apiUrl("/v1/admin/ai/pipelines"), () =>
        HttpResponse.json({
          items: [
            {
              ...aiPipelinesFixture[0],
              route: put ?? aiPipelinesFixture[0]!.route,
            },
          ],
        }),
      ),
      http.put(apiUrl("/v1/admin/ai/pipelines/:pipeline"), async ({ request }) => {
        put = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({})
      }),
      http.delete(apiUrl("/v1/admin/ai/pipelines/:pipeline"), () => {
        reset = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderAdmin(<PipelinesPage />)
    expect(await screen.findByText("studio_quiz, studio_report")).toBeTruthy()
    expect(screen.getAllByText("anthropic/claude-haiku-5.5").length).toBeGreaterThan(0)

    const card = screen.getByRole("group", { name: "studio" })
    setValue(within(card).getByLabelText("Model"), "google/gemini-3.8-flash")
    await selectDropdownValue(user, within(card).getByLabelText("Reasoning"), "low")
    fireEvent.click(within(card).getByRole("button", { name: "Save" }))
    await waitUntil(() => put !== null)
    expect(put).toEqual({
      connector_id: null,
      model: "google/gemini-3.8-flash",
      reasoning_effort: "low",
      tracing_enabled: null,
      capture_content: null,
    })

    const resetButton = await waitFor(() => {
      const button = within(screen.getByRole("group", { name: "studio" })).getByRole("button", {
        name: "Reset to environment",
      })
      if ((button as HTMLButtonElement).disabled) throw new Error("reset still disabled")
      return button
    })
    fireEvent.click(resetButton)
    await waitUntil(() => reset)
  })

  test("a search pipeline only offers search connectors", async () => {
    const user = userEvent.setup()
    renderAdmin(<PipelinesPage />)
    const card = await screen.findByRole("group", { name: "web_search" })
    await user.click(within(card).getByLabelText("Connector"))
    const options = (await screen.findAllByRole("option")).map((o) => o.textContent)
    expect(options).toContain("Exa")
    expect(options).not.toContain("OpenRouter")
    expect(within(card).queryByLabelText("Reasoning")).toBeNull()
  })
})

describe("requests and prompt versions", () => {
  test("lists requests, shows the argument schema and a diff between versions", async () => {
    server.use(
      http.get(apiUrl("/v1/admin/ai/prompts/:task/:name/versions"), () =>
        HttpResponse.json({
          items: [
            {
              version: 3,
              locale: "",
              source: "admin",
              active: true,
              hash: "c",
              chars: 4210,
              tokens_est: 1053,
              created_at: "2026-11-19T08:00:00Z",
              created_by: null,
              note: "",
              has_diff: true,
            },
            {
              version: 2,
              locale: "",
              source: "code",
              active: false,
              hash: "b",
              chars: 4000,
              tokens_est: 1000,
              created_at: "2026-11-10T08:00:00Z",
              created_by: null,
              note: "code default",
              has_diff: true,
            },
          ],
        }),
      ),
      http.get(apiUrl("/v1/admin/ai/prompts/:task/:name/diff"), ({ request }) => {
        const url = new URL(request.url)
        return HttpResponse.json({
          task: "studio_quiz",
          name: "main",
          locale: "",
          from_version: Number(url.searchParams.get("from") ?? 2),
          to_version: Number(url.searchParams.get("to") ?? 3),
          diff: "--- v2\n+++ v3\n@@ -1 +1 @@\n-Be kind.\n+Be brief.",
          chars_delta: 210,
          tokens_delta: 53,
        })
      }),
    )
    renderAdmin(<RequestsPage />)
    expect(await screen.findByText("notebooks.studio_quiz.main")).toBeTruthy()
    expect(screen.getByText("Code default changed")).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: "Open notebooks.studio_quiz.main" }))
    expect(await screen.findByText("topic")).toBeTruthy()
    expect(await screen.findByText("≈1,053 tokens")).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: "Diff v3" }))
    const diff = await screen.findByLabelText("Diff")
    expect(diff.textContent).toContain("+Be brief.")
    expect(diff.textContent).toContain("-Be kind.")
  })

  test("the prompts history can show what a version changed", async () => {
    server.use(
      http.get(apiUrl("/v1/admin/ai/prompts/:task/:name/diff"), () =>
        HttpResponse.json({
          task: "essay_review",
          name: "system",
          locale: "",
          from_version: 1,
          to_version: 2,
          diff: "--- v1\n+++ v2\n@@ -1 +1 @@\n-A\n+B",
          chars_delta: 0,
          tokens_delta: 0,
        }),
      ),
    )
    const detail = {
      task: "essay_review",
      name: "system",
      summary: "",
      template: false,
      placeholders: [],
      locale: "",
      text: "B",
      builtin: "A",
      hash: "h2",
      version: 2,
      versions: [
        {
          id: "00000000-0000-4000-8000-000000000002",
          version: 2,
          locale: "",
          text: "B",
          hash: "h2",
          active: true,
          created_at: "2026-11-10T08:00:00Z",
          created_by: null,
          note: "",
        },
        {
          id: "00000000-0000-4000-8000-000000000001",
          version: 1,
          locale: "",
          text: "A",
          hash: "h1",
          active: false,
          created_at: "2026-11-09T08:00:00Z",
          created_by: null,
          note: "",
        },
      ],
    } as PromptDetail
    renderAdmin(<PromptHistory detail={detail} />)
    fireEvent.click(screen.getByRole("button", { name: "Show changes of version 2" }))
    const diff = await screen.findByLabelText("Diff")
    expect(diff.textContent).toContain("+B")
    expect(screen.queryByRole("button", { name: "Show changes of version 1" })).toBeNull()
  })
})

describe("analytics", () => {
  test("shows request averages and spend per user", async () => {
    const totals = {
      calls: 120,
      failed: 2,
      avg_prompt_tokens: 1100.5,
      avg_prompt_chars: 4400,
      avg_answer_chars: 2100,
      avg_output_tokens: 610,
      avg_tool_calls: 0.4,
      cost_micro: 1_250_000,
    }
    server.use(
      http.get(apiUrl("/v1/admin/ai/analytics/requests"), () =>
        HttpResponse.json({ items: [{ key: "notebooks.studio_quiz.main", ...totals }], totals }),
      ),
      http.get(apiUrl("/v1/admin/ai/analytics/spend"), () =>
        HttpResponse.json({
          items: [
            {
              key: "u1",
              cost_micro: 530_000,
              calls: 88,
              users: 1,
              user: { id: "u1", full_name: "Aziza Karimova", role: "student" },
            },
          ],
          total_cost_micro: 530_000,
        }),
      ),
      http.get(apiUrl("/v1/admin/ai/analytics/spend/daily"), () =>
        HttpResponse.json({
          items: [{ day: "2026-11-19", request_id: "notebooks.studio_quiz.main", cost_micro: 530_000, calls: 88 }],
        }),
      ),
      http.get(apiUrl("/v1/admin/ai/analytics/prompt-sizes"), () =>
        HttpResponse.json({
          items: [
            {
              task: "studio_quiz",
              name: "main",
              locale: "",
              version: 0,
              source: "code",
              chars: 3900,
              tokens_est: 975,
              created_at: null,
              active: false,
            },
            {
              task: "studio_quiz",
              name: "main",
              locale: "",
              version: 1,
              source: "admin",
              chars: 4000,
              tokens_est: 1000,
              created_at: "2026-11-10T08:00:00Z",
              active: true,
            },
          ],
        }),
      ),
    )
    renderAdmin(<AnalyticsPage />)
    expect(await screen.findByText("Aziza Karimova")).toBeTruthy()
    expect(screen.getAllByText("$0.53").length).toBeGreaterThan(0)
    await waitFor(() => expect(screen.getAllByText("notebooks.studio_quiz.main").length).toBeGreaterThan(0))
    expect(screen.getAllByText("2,100").length).toBeGreaterThan(0)
  })
})
