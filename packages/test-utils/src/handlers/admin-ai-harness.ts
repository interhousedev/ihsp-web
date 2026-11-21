import type {
  AiConnector,
  AiConnectorCreateBody,
  AiConnectorPatchBody,
  AiPipeline,
  AiPipelineBody,
  AiRequestItem,
} from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { apiUrl, param, problem, readJson } from "./utils"

export const aiConnectorsFixture: AiConnector[] = [
  {
    id: "openrouter",
    kind: "openrouter",
    title: "OpenRouter",
    base_url: null,
    enabled: true,
    has_secret: true,
    secret_last4: "a1b2",
    builtin: true,
    source: "env",
  },
  {
    id: "exa",
    kind: "exa",
    title: "Exa",
    base_url: null,
    enabled: true,
    has_secret: false,
    secret_last4: null,
    builtin: true,
    source: "env",
  },
]

export const aiPipelinesFixture: AiPipeline[] = [
  {
    pipeline: "studio",
    tasks: ["studio_quiz", "studio_report"],
    route: { connector_id: null, model: null, reasoning_effort: null, updated_at: null },
    effective: {
      connector_id: "openrouter",
      model: "anthropic/claude-haiku-5.5",
      reasoning_effort: "none",
      source: "env",
    },
    env_default: { connector_id: "openrouter", model: "anthropic/claude-haiku-5.5", reasoning_effort: "none" },
    tracing: { enabled: false, capture_content: false, default_enabled: false },
  },
  {
    pipeline: "web_search",
    tasks: ["web_search"],
    route: { connector_id: null, model: null, reasoning_effort: null, updated_at: null },
    effective: { connector_id: "exa", model: "", reasoning_effort: "none", source: "env" },
    env_default: { connector_id: "exa", model: "", reasoning_effort: "none" },
    tracing: { enabled: false, capture_content: false, default_enabled: false },
  },
]

export const aiRequestsFixture: AiRequestItem[] = [
  {
    id: "notebooks.studio_quiz.main",
    owner_app: "notebooks",
    task: "studio_quiz",
    pipeline: "studio",
    template_id: "studio_quiz/main",
    args_schema: { type: "object", properties: { topic: { type: "string" } }, required: ["topic"] },
    tools: [],
    summary: "Quiz generation",
    published_at: "2026-11-20T08:00:00Z",
    retired: false,
    active_version: 3,
    code_version: 2,
    code_changed_since_active: true,
  },
]

let connectors = [...aiConnectorsFixture]

/** AI harness (admin): connectors, pipelines, requests, prompt versions, analytics. Empty analytics by default. */
export const adminAiHarnessHandlers = [
  http.get(apiUrl("/v1/admin/ai/connectors"), () =>
    HttpResponse.json({ items: connectors, kinds: ["openrouter", "anthropic", "openai_compatible", "exa"] }),
  ),
  http.post(apiUrl("/v1/admin/ai/connectors"), async ({ request }) => {
    const body = await readJson<AiConnectorCreateBody>(request)
    const created: AiConnector = {
      id: body.id ?? "new",
      kind: body.kind ?? "openai_compatible",
      title: body.title ?? "",
      base_url: body.base_url ?? null,
      enabled: true,
      has_secret: Boolean(body.api_key),
      secret_last4: body.api_key ? body.api_key.slice(-4) : null,
      builtin: false,
      source: "db",
    }
    connectors = [...connectors, created]
    return HttpResponse.json(created, { status: 201 })
  }),
  http.patch(apiUrl("/v1/admin/ai/connectors/:id"), async ({ params, request }) => {
    const body = await readJson<AiConnectorPatchBody>(request)
    const id = param(params, "id")
    const current = connectors.find((item) => item.id === id) ?? connectors[0]
    return HttpResponse.json({ ...current, ...body, api_key: undefined })
  }),
  http.delete(apiUrl("/v1/admin/ai/connectors/:id"), ({ params }) => {
    const id = param(params, "id")
    if (id === "openrouter")
      return problem(409, "connector_in_use", "In use", {
        params: { pipelines: "studio" },
        messageKey: "connector_in_use",
      })
    connectors = connectors.filter((item) => item.id !== id)
    return new HttpResponse(null, { status: 204 })
  }),
  http.post(apiUrl("/v1/admin/ai/connectors/:id/test"), () =>
    HttpResponse.json({ ok: true, latency_ms: 412, error: null }),
  ),
  http.get(apiUrl("/v1/admin/ai/pipelines"), () => HttpResponse.json({ items: aiPipelinesFixture })),
  http.put(apiUrl("/v1/admin/ai/pipelines/:pipeline"), async ({ params, request }) => {
    const body = await readJson<AiPipelineBody>(request)
    const base = aiPipelinesFixture.find((item) => item.pipeline === param(params, "pipeline")) ?? aiPipelinesFixture[0]
    return HttpResponse.json({ ...base, route: { ...base.route, ...body } })
  }),
  http.delete(apiUrl("/v1/admin/ai/pipelines/:pipeline"), () => new HttpResponse(null, { status: 204 })),
  http.get(apiUrl("/v1/admin/ai/requests"), () => HttpResponse.json({ items: aiRequestsFixture })),
  http.get(apiUrl("/v1/admin/ai/prompts/:task/:name/versions"), () => HttpResponse.json({ items: [] })),
  http.get(apiUrl("/v1/admin/ai/prompts/:task/:name/diff"), ({ params }) =>
    HttpResponse.json({
      task: param(params, "task"),
      name: param(params, "name"),
      locale: "en",
      from_version: 1,
      to_version: 2,
      diff: "",
    }),
  ),
  http.get(apiUrl("/v1/admin/ai/analytics/prompt-sizes"), () => HttpResponse.json({ items: [] })),
  http.get(apiUrl("/v1/admin/ai/analytics/requests"), () =>
    HttpResponse.json({
      items: [],
      totals: {
        calls: 0,
        failed: 0,
        avg_prompt_tokens: 0,
        avg_prompt_chars: 0,
        avg_answer_chars: 0,
        avg_output_tokens: 0,
        avg_tool_calls: 0,
        cost_micro: 0,
      },
    }),
  ),
  http.get(apiUrl("/v1/admin/ai/analytics/spend"), () => HttpResponse.json({ items: [], total_cost_micro: 0 })),
  http.get(apiUrl("/v1/admin/ai/analytics/spend/daily"), () => HttpResponse.json({ items: [] })),
]
