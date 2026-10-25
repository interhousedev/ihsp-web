import { describe, expect, it } from "bun:test"
import {
  apiUrl,
  courseWorkspaceReadOnly,
  nbIds,
  notebookTurn,
  server,
  setWebQuota,
  webQuotaDisabled,
  webQuotaSpent,
  webResults,
} from "@ihsp/test-utils"
import { act, screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { ask, chatUrl, controlledStream, enter, messageField, renderChat } from "./chat-test-support"
import { useChatTurn } from "./use-chat-turn"

allowSlowRenders()

const WEB_KEY = `ihsp.notebook.web.${nbIds.notebook}`
const WEB_BUTTON = { name: "Search the web too" }

function problem(status: number, type: string, params: Record<string, unknown> = {}) {
  return HttpResponse.json(
    { type, title: type, status, params },
    { status, headers: { "Content-Type": "application/problem+json" } },
  )
}

const quotaExceeded = () =>
  problem(429, "web-search/quota-exceeded", {
    limit: 10,
    left: 0,
    needed: 1,
    resets_at: "2026-10-08T00:00:00Z",
  })

/** Answers every send with a plain turn and records the JSON bodies. */
function captureSends() {
  const bodies: unknown[] = []
  server.use(
    http.post(chatUrl("/messages"), async ({ request }) => {
      const body = (await request.json()) as { text: string }
      bodies.push(body)
      return HttpResponse.json(notebookTurn(body.text))
    }),
  )
  return bodies
}

describe("NotebookComposer: web switch", () => {
  it("shows a ghost globe button that is off by default, without chip or quota line", async () => {
    await renderChat()

    const button = await screen.findByRole("button", WEB_BUTTON)
    expect(button).toHaveAttribute("aria-pressed", "false")
    expect(screen.queryByText("Web", { selector: "span" })).not.toBeInTheDocument()
    expect(screen.queryByText(/web searches left today/)).not.toBeInTheDocument()
  })

  it("shows the Web chip and the quota line when on and removes both from the chip", async () => {
    const { user } = await renderChat()

    await user.click(await screen.findByRole("button", WEB_BUTTON))

    expect(screen.getByRole("button", WEB_BUTTON)).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByText("Web", { selector: "span" })).toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent("4 of 10 web searches left today")

    await user.click(screen.getByRole("button", { name: "Turn off web search" }))

    expect(screen.getByRole("button", WEB_BUTTON)).toHaveAttribute("aria-pressed", "false")
    expect(screen.queryByText(/web searches left today/)).not.toBeInTheDocument()
  })

  it("sends no web_search while the switch is off", async () => {
    const bodies = captureSends()
    const { user } = await renderChat()
    await screen.findByRole("article", { name: "Assistant" })

    await ask(user, "Plain question")

    await waitFor(() => expect(bodies).toEqual([{ text: "Plain question" }]))
  })

  it("sends web_search: true while the switch is on, for every question", async () => {
    const bodies = captureSends()
    const { user } = await renderChat()
    await screen.findByRole("article", { name: "Assistant" })

    await user.click(await screen.findByRole("button", WEB_BUTTON))
    await ask(user, "With the web")
    await waitFor(() => expect(bodies).toHaveLength(1))
    await waitFor(() => expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument())
    await ask(user, "Again")

    await waitFor(() => expect(bodies).toHaveLength(2))
    expect(bodies).toEqual([
      { text: "With the web", web_search: true },
      { text: "Again", web_search: true },
    ])
    expect(screen.getByRole("button", WEB_BUTTON)).toHaveAttribute("aria-pressed", "true")
  })

  it("shows the spent searches after a web answer", async () => {
    const { user } = await renderChat()
    await screen.findByRole("article", { name: "Assistant" })
    await user.click(await screen.findByRole("button", WEB_BUTTON))
    expect(screen.getByRole("status")).toHaveTextContent("4 of 10 web searches left today")

    await ask(user, "Search please")

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("3 of 10 web searches left today"))
  })

  it("remembers the switch for the notebook in sessionStorage", async () => {
    const first = await renderChat()
    await first.user.click(await screen.findByRole("button", WEB_BUTTON))
    expect(window.sessionStorage.getItem(WEB_KEY)).toBe("1")
    first.unmount()

    const second = await renderChat()
    expect(await screen.findByRole("button", WEB_BUTTON)).toHaveAttribute("aria-pressed", "true")
    await second.user.click(screen.getByRole("button", { name: "Turn off web search" }))
    expect(window.sessionStorage.getItem(WEB_KEY)).toBeNull()
  })

  it("is hidden when web search is turned off for the deployment", async () => {
    setWebQuota(webQuotaDisabled)
    await renderChat()

    await screen.findByRole("button", { name: "Configure chat" })
    expect(screen.queryByRole("button", WEB_BUTTON)).not.toBeInTheDocument()
  })

  it("ignores a remembered switch when web search is turned off", async () => {
    window.sessionStorage.setItem(WEB_KEY, "1")
    setWebQuota(webQuotaDisabled)
    const bodies = captureSends()
    const { user } = await renderChat()
    await screen.findByRole("article", { name: "Assistant" })

    await ask(user, "No web here")

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({ text: "No web here" })
  })

  it("is disabled with the reset time when every search of today is used", async () => {
    setWebQuota(webQuotaSpent)
    const { user } = await renderChat()

    const button = await screen.findByRole("button", WEB_BUTTON)
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute("title", expect.stringMatching(/^No web searches left today\. Resets at /))
    await user.click(button)
    expect(button).toHaveAttribute("aria-pressed", "false")
  })

  it("keeps a switched-on chip with the no-searches line when the quota ran out, and sends without the flag", async () => {
    window.sessionStorage.setItem(WEB_KEY, "1")
    setWebQuota(webQuotaSpent)
    const bodies = captureSends()
    const { user } = await renderChat()

    expect(await screen.findByRole("status")).toHaveTextContent(/No web searches left today\. Resets at /)
    expect(screen.getByRole("button", WEB_BUTTON)).toBeDisabled()
    await ask(user, "Still asking")

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({ text: "Still asking" })
  })

  it("is kept for read-only course staff, who can still look at the switch", async () => {
    await renderChat({ notebook: courseWorkspaceReadOnly })

    expect(
      await screen.findByText("You can read this workspace but not change it, so the chat is off."),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", WEB_BUTTON)).toBeInTheDocument()
  })
})

describe("NotebookChat: web search failures", () => {
  it("keeps the draft, turns the switch off and offers Send without web search on 429", async () => {
    server.use(http.post(chatUrl("/messages"), quotaExceeded, { once: true }))
    const bodies: unknown[] = []
    const { user } = await renderChat()
    await screen.findByRole("article", { name: "Assistant" })
    await user.click(await screen.findByRole("button", WEB_BUTTON))

    await ask(user, "What is new?")

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent(/No web searches left today\. Resets at /)
    await waitFor(() => expect(messageField()).toHaveValue("What is new?"))
    expect(screen.getByRole("button", WEB_BUTTON)).toHaveAttribute("aria-pressed", "false")
    expect(window.sessionStorage.getItem(WEB_KEY)).toBeNull()

    server.use(
      http.post(chatUrl("/messages"), async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json(notebookTurn("What is new?"))
      }),
    )
    await user.click(screen.getByRole("button", { name: "Send without web search" }))

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({ text: "What is new?" })
    // The question is sent, so the field is empty and the alert is gone.
    await waitFor(() => expect(messageField()).toHaveValue(""))
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument())
    expect(screen.queryByRole("button", { name: "Send without web search" })).not.toBeInTheDocument()
  })

  it("does the same on 503 with the unavailable text", async () => {
    server.use(http.post(chatUrl("/messages"), () => problem(503, "web-search/unavailable"), { once: true }))
    const { user } = await renderChat()
    await screen.findByRole("article", { name: "Assistant" })
    await user.click(await screen.findByRole("button", WEB_BUTTON))

    await ask(user, "Anything?")

    expect(await screen.findByRole("alert")).toHaveTextContent("Web search is not available right now.")
    await waitFor(() => expect(messageField()).toHaveValue("Anything?"))
    expect(screen.getByRole("button", WEB_BUTTON)).toHaveAttribute("aria-pressed", "false")
    expect(screen.getByRole("button", { name: "Send without web search" })).toBeInTheDocument()
  })

  it("hides the switch and shows the message when web search was turned off meanwhile", async () => {
    server.use(
      http.post(
        chatUrl("/messages"),
        () => {
          setWebQuota(webQuotaDisabled)
          return problem(404, "web-search/disabled")
        },
        { once: true },
      ),
    )
    const { user } = await renderChat()
    await screen.findByRole("article", { name: "Assistant" })
    await user.click(await screen.findByRole("button", WEB_BUTTON))

    await ask(user, "Is it on?")

    expect(await screen.findByRole("alert")).toHaveTextContent("Web search is turned off.")
    await waitFor(() => expect(screen.queryByRole("button", WEB_BUTTON)).not.toBeInTheDocument())
    await waitFor(() => expect(messageField()).toHaveValue("Is it on?"))
    expect(screen.queryByRole("button", { name: "Send without web search" })).not.toBeInTheDocument()
  })

  it("does not offer Send without web search for other failures", async () => {
    server.use(http.post(chatUrl("/messages"), () => problem(422, "notebooks/no-sources-selected"), { once: true }))
    const { user } = await renderChat()
    await screen.findByRole("article", { name: "Assistant" })
    await user.click(await screen.findByRole("button", WEB_BUTTON))

    await ask(user, "Hello")

    expect(await screen.findByRole("alert")).toHaveTextContent("Select at least one ready source first.")
    expect(screen.queryByRole("button", { name: "Send without web search" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", WEB_BUTTON)).toHaveAttribute("aria-pressed", "true")
  })
})

describe("useChatTurn: the web event", () => {
  function Harness() {
    const turn = useChatTurn(nbIds.notebook)
    return (
      <>
        <button type="button" onClick={() => void turn.send("Question", { webSearch: true })}>
          go
        </button>
        <output aria-label="pages">{turn.pending?.web.map((item) => item.n).join(",") ?? "-"}</output>
      </>
    )
  }

  it("stores the web pages on the pending answer before done", async () => {
    const stream = controlledStream()
    stream.install()
    const { user } = renderNotebook(<Harness />)

    await user.click(screen.getByRole("button", { name: "go" }))
    stream.push("message", { id: "q", seq: 3 })
    expect(screen.getByLabelText("pages")).toHaveTextContent("")
    stream.push("web", { results: webResults })
    stream.push("delta", { text: "Sugar ⟦w1⟧" })

    await waitFor(() => expect(screen.getByLabelText("pages")).toHaveTextContent("1,2"))
  })

  it("sends web_search: true in the request body", async () => {
    const bodies: unknown[] = []
    server.use(
      http.post(apiUrl(`/v1/notebooks/${nbIds.notebook}/chat/messages`), async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json(notebookTurn("Question"))
      }),
    )
    const { user } = renderNotebook(<Harness />)

    await user.click(screen.getByRole("button", { name: "go" }))

    await waitFor(() => expect(bodies).toEqual([{ text: "Question", web_search: true }]))
  })
})

describe("NotebookChat: streamed web pages", () => {
  it("resolves the web chip of the streaming answer before the final event", async () => {
    const stream = controlledStream()
    stream.install()
    const { user } = await renderChat()
    await screen.findByRole("article", { name: "Assistant" })
    await user.click(await screen.findByRole("button", WEB_BUTTON))

    await ask(user, "What happens in the stroma?")
    stream.push("message", { id: "stream-question", seq: 3 })
    stream.push("web", { results: webResults })
    stream.push("delta", { text: "Plants turn light into sugar ⟦w1⟧. " })

    const streaming = await screen.findByRole("article", { name: "Assistant", busy: true })
    expect(
      await within(streaming).findByRole("link", { name: /Web source 1: Photosynthesis - Wikipedia/ }),
    ).toBeInTheDocument()
    expect(within(streaming).queryByText(/⟦w1⟧/)).not.toBeInTheDocument()
    await act(async () => {
      stream.close()
    })
  })
})

describe("NotebookComposer: field", () => {
  it("still enters text with the switch on", async () => {
    const { user } = await renderChat()
    await user.click(await screen.findByRole("button", WEB_BUTTON))

    await enter(user, "typed")

    expect(messageField()).toHaveValue("typed")
  })
})
