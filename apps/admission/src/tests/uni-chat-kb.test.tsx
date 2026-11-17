import { describe, expect, test } from "bun:test"
import { apiUrl, chatHomework, ids, server, userMe } from "@ihsp/test-utils"
import type { AdmissionKbArticle, AdmissionMatch as Match } from "@ihsp/api"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { UniChatPanel } from "../features/discover/components/uni-chat-panel"
import { ArticleList } from "../features/kb/components/article-list"
import { ArticleReader } from "../features/kb/components/article-reader"
import { StaffKbPage } from "../features/kb/staff/staff-kb-page"
import { renderAdmissionApp } from "./helpers"

const match: Match = {
  university_id: "u1",
  name: "Alpha College",
  city: "Boston",
  country: "US",
  logo_url: null,
  cover_url: null,
  institution_type: "private",
  admission_rate: 0.2,
  cost_after_aid_usd: 12000,
  match_pct: 87,
  overlap: { count: 2, total: 5, tags: [] },
  status: "target",
}

const counselor = { session: { user: { ...userMe, roles: ["counselor" as const] } } }

const sse = (events: [string, unknown][]) => {
  const encoder = new TextEncoder()
  return new HttpResponse(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const [name, data] of events)
          controller.enqueue(encoder.encode(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`))
        controller.close()
      },
    }),
    { headers: { "Content-Type": "text/event-stream" } },
  )
}

function serveUniChat(autoRunPending: boolean) {
  const runs: (string | null)[] = []
  server.use(
    http.post(apiUrl("/v1/admission/uni-chats/u1"), () =>
      HttpResponse.json({
        chat_id: ids.chat2,
        institution_id: "u1",
        created: autoRunPending,
        auto_run_pending: autoRunPending,
        has_default_prompt: false,
      }),
    ),
    http.get(apiUrl("/v1/admission/uni-chats/u1/suggestions"), () =>
      HttpResponse.json({ questions: ["What are the deadlines?"], academic: [], activities: [] }),
    ),
    http.post(apiUrl("/v1/admission/uni-chats/u1/run-default"), ({ request }) => {
      runs.push(new URL(request.url).searchParams.get("auto"))
      return sse([["delta", { text: "Research" }]])
    }),
    http.get(apiUrl(`/v1/ai/chats/${ids.chat2}`), () =>
      HttpResponse.json({ ...chatHomework, messages: [], shared: false }),
    ),
  )
  return runs
}

describe("university chat", () => {
  test("a new university runs the default research exactly once", async () => {
    const runs = serveUniChat(true)
    const view = renderAdmissionApp(<UniChatPanel match={match} />)
    expect(await screen.findByText("What are the deadlines?")).toBeInTheDocument()
    await waitFor(() => expect(runs).toEqual(["true"]))
    view.rerender(<UniChatPanel match={{ ...match }} />)
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(runs).toEqual(["true"])
  })

  test("a seen university waits for the manual Run research button", async () => {
    const runs = serveUniChat(false)
    renderAdmissionApp(<UniChatPanel match={match} />)
    const button = await screen.findByRole("button", { name: "Run research" })
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(runs).toEqual([])
    fireEvent.click(button)
    await waitFor(() => expect(runs).toEqual(["false"]))
  })

  test("a research stopped by a limit says why instead of the generic failure", async () => {
    serveUniChat(true)
    server.use(
      http.post(apiUrl("/v1/admission/uni-chats/u1/run-default"), () =>
        sse([["error", { type: "ai/limit-reached", title: "Limit reached", params: {} }]]),
      ),
    )
    renderAdmissionApp(<UniChatPanel match={match} />)
    expect(await screen.findByRole("alert")).toHaveTextContent("You reached the assistant limit")
  })

  test("the smart weekly limit gets the panel's own line", async () => {
    serveUniChat(true)
    server.use(
      http.post(apiUrl("/v1/admission/uni-chats/u1/run-default"), () =>
        sse([["error", { type: "ai/smart-weekly-limit", title: "Weekly limit", params: {} }]]),
      ),
    )
    renderAdmissionApp(<UniChatPanel match={match} />)
    expect(await screen.findByRole("alert")).toHaveTextContent("You used this week's advanced AI requests")
  })

  test("rate-limited suggestions show a friendly line instead of missing chips", async () => {
    serveUniChat(false)
    server.use(
      http.get(apiUrl("/v1/admission/uni-chats/u1/suggestions"), () =>
        HttpResponse.json(
          { type: "common/rate-limited", title: "Too many requests", status: 429 },
          { status: 429, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    )
    renderAdmissionApp(<UniChatPanel match={match} />)
    expect(await screen.findByTestId("uni-chat-chips-limited")).toHaveTextContent(
      "Quick questions are not available right now",
    )
  })
})

const article = (id: string, title: string, over: Partial<AdmissionKbArticle> = {}): AdmissionKbArticle => ({
  id,
  title,
  body: `Body of ${title}`,
  locale: "en",
  status: "published",
  tags: ["visa"],
  author_id: "a1",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-02T00:00:00Z",
  ...over,
})

describe("knowledge base", () => {
  test("lists published articles and links to the reader", async () => {
    let query = ""
    server.use(
      http.get(apiUrl("/v1/admission/kb/articles"), ({ request }) => {
        query = new URL(request.url).search
        return HttpResponse.json({ items: [article("k1", "Visa basics")], can_edit: false })
      }),
    )
    renderAdmissionApp(<ArticleList locale="en" activeId={null} />)
    const link = await screen.findByRole("link", { name: "Visa basics" })
    expect(link.getAttribute("href")).toMatch(/^\/faq\/?\?id=k1$/)
    expect(query).toContain("locale=en")
    expect(query).toContain("status=published")
  })

  test("reads one article", async () => {
    server.use(http.get(apiUrl("/v1/admission/kb/articles/k1"), () => HttpResponse.json(article("k1", "Visa basics"))))
    renderAdmissionApp(<ArticleReader id="k1" />)
    expect(await screen.findByRole("heading", { name: "Visa basics" })).toBeInTheDocument()
    expect(screen.getByText("Body of Visa basics")).toBeInTheDocument()
  })

  test("the editor creates an article only when can_edit is true", async () => {
    server.use(
      http.get(apiUrl("/v1/admission/kb/articles"), () =>
        HttpResponse.json({ items: [article("k1", "Visa basics", { status: "draft" })], can_edit: false }),
      ),
    )
    renderAdmissionApp(<StaffKbPage />, counselor)
    expect(await screen.findByText("Visa basics")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "New article" })).toBeNull()
  })

  test("an editor can create an article", async () => {
    let created: unknown = null
    server.use(
      http.get(apiUrl("/v1/admission/kb/articles"), () => HttpResponse.json({ items: [], can_edit: true })),
      http.post(apiUrl("/v1/admission/kb/articles"), async ({ request }) => {
        created = await request.json()
        return HttpResponse.json(article("k2", "Fees"))
      }),
    )
    renderAdmissionApp(<StaffKbPage />, counselor)
    fireEvent.click(await screen.findByRole("button", { name: "New article" }))
    fireEvent.change(await screen.findByLabelText("Title"), { target: { value: "Fees" } })
    fireEvent.change(screen.getByLabelText("Text (Markdown)"), { target: { value: "Pay here" } })
    fireEvent.change(screen.getByLabelText("Tags, comma separated"), { target: { value: "money, money, visa" } })
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() =>
      expect(created).toEqual({
        title: "Fees",
        body: "Pay here",
        locale: "ru",
        tags: ["money", "visa"],
        status: "draft",
      }),
    )
  })
})
