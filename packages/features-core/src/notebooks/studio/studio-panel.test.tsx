import { afterEach, describe, expect, it, mock } from "bun:test"
import type { ArtifactCreate, ArtifactItem, NotebookDetail, NotebookUsage } from "@ihsp/api"
import {
  apiUrl,
  artifactGenerating,
  nbIds,
  notebookDetail,
  notebookUsage,
  notebookUsageLimitReached,
  server,
} from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { StudioPanel } from "./studio-panel"

allowSlowRenders()

const ARTIFACTS_URL = apiUrl(`/v1/notebooks/${nbIds.notebook}/artifacts`)

const noSources: NotebookDetail = {
  ...notebookDetail,
  selected_source_count: 0,
}

function problem(status: number, type: string, params: Record<string, unknown> = {}) {
  return HttpResponse.json(
    { type, title: type, status, message_key: type.replace("/", "-"), params },
    { status, headers: { "Content-Type": "application/problem+json" } },
  )
}

/** Answers every POST with a queued item and records the request bodies. */
function captureCreates(): ArtifactCreate[] {
  const bodies: ArtifactCreate[] = []
  server.use(
    http.post(ARTIFACTS_URL, async ({ request }) => {
      const body = (await request.json()) as ArtifactCreate
      bodies.push(body)
      const item: ArtifactItem = {
        ...artifactGenerating,
        id: `new-${bodies.length}`,
        kind: body.kind,
        status: "queued",
        progress: null,
        prompt: body.prompt ?? null,
      }
      return HttpResponse.json(item, { status: 202 })
    }),
  )
  return bodies
}

function useUsage(usage: NotebookUsage) {
  server.use(http.get(apiUrl("/v1/notebooks/usage"), () => HttpResponse.json(usage)))
}

function setOnline(online: boolean) {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    get: () => online,
  })
  window.dispatchEvent(new Event(online ? "online" : "offline"))
}

function tile(name: string): HTMLElement {
  return screen.getByRole("button", { name })
}

afterEach(() => setOnline(true))

describe("StudioPanel: tiles", () => {
  it("shows the eight tiles (no audio or video tile) with the Studio heading", async () => {
    renderNotebook(<StudioPanel notebook={notebookDetail} />)

    expect(screen.getByRole("heading", { name: "Studio" })).toBeInTheDocument()
    const grid = screen.getByRole("list", { name: "Create study materials" })
    expect(within(grid).getAllByRole("listitem")).toHaveLength(8)
    for (const label of [
      "Slide deck",
      "Mind map",
      "Conspect",
      "Reports",
      "Flash cards",
      "Quiz",
      "Infographic",
      "Data table",
    ]) {
      expect(tile(label)).toBeEnabled()
    }
    expect(screen.queryByRole("button", { name: /audio|video/i }) === null).toBe(true)
    expect(await screen.findByRole("list", { name: "Studio items" })).toBeInTheDocument()
  })

  it("disables every tile and says why when no source is selected", async () => {
    renderNotebook(<StudioPanel notebook={noSources} />)

    expect(await screen.findByText("Add and select a source first")).toBeInTheDocument()
    for (const label of [
      "Slide deck",
      "Mind map",
      "Conspect",
      "Reports",
      "Flash cards",
      "Quiz",
      "Infographic",
      "Data table",
    ]) {
      expect(tile(label)).toBeDisabled()
      expect(tile(label)).toHaveAttribute("title", "Add and select a source first")
    }
  })

  it("posts the default options of a tile on click", async () => {
    const bodies = captureCreates()
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)

    await user.click(tile("Quiz"))

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({
      kind: "quiz",
      options: {
        count: "standard",
        difficulty: "medium",
        types: ["single", "multiple", "true_false"],
      },
    })

    await user.click(tile("Conspect"))
    await waitFor(() => expect(bodies).toHaveLength(2))
    expect(bodies[1]).toEqual({
      kind: "report",
      options: { format: "conspect", detail: "standard", style: "outline" },
    })

    await user.click(tile("Data table"))
    await waitFor(() => expect(bodies).toHaveLength(3))
    expect(bodies[2]).toEqual({
      kind: "data_table",
      options: { max_rows: 25 },
    })
  })

  it("shows the new item at the top of the list right away", async () => {
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    const list = await screen.findByRole("list", { name: "Studio items" })
    const before = within(list).getAllByRole("listitem").length

    await user.click(tile("Mind map"))

    await waitFor(() =>
      expect(within(screen.getByRole("list", { name: "Studio items" })).getAllByRole("listitem")).toHaveLength(
        before + 1,
      ),
    )
    expect(within(screen.getByRole("list", { name: "Studio items" })).getAllByRole("listitem")[0]).toHaveTextContent(
      "Mind map",
    )
  })

  it("shows a spinner on the tile of a kind that is being created, and the tile still works", async () => {
    server.use(http.get(ARTIFACTS_URL, () => HttpResponse.json([artifactGenerating])))
    const bodies = captureCreates()
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)

    const quizTile = tile("Quiz").closest("li") as HTMLElement
    expect(await within(quizTile).findByRole("status", { name: "Being created" })).toBeInTheDocument()
    expect(within(tile("Mind map").closest("li") as HTMLElement).queryByRole("status")).not.toBeInTheDocument()

    await user.click(tile("Quiz"))
    await waitFor(() => expect(bodies).toHaveLength(1))
  })
})

describe("StudioPanel: reports", () => {
  it("opens the format picker from the Reports tile", async () => {
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)

    await user.click(tile("Reports"))

    const dialog = await screen.findByRole("dialog", {
      name: "Choose a report format",
    })
    for (const format of ["Study guide", "Briefing", "FAQ", "Timeline", "Article", "Create your own"]) {
      expect(within(dialog).getByRole("button", { name: new RegExp(`^${format}`) })).toBeInTheDocument()
    }
    expect(within(dialog).queryByRole("button", { name: /^Conspect/ })).not.toBeInTheDocument()
  })

  it("continues from the picker into the form of that format and posts it", async () => {
    const bodies = captureCreates()
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)

    await user.click(tile("Reports"))
    await user.click(await screen.findByRole("button", { name: /^Briefing/ }))

    const form = await screen.findByRole("dialog", {
      name: "Customize Briefing",
    })
    // A conspect has a style; a briefing does not.
    expect(within(form).queryByRole("group", { name: "Style" })).not.toBeInTheDocument()
    await user.click(within(form).getByRole("button", { name: "Long" }))
    await user.click(within(form).getByRole("button", { name: "Generate" }))

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({
      kind: "report",
      options: { format: "briefing", detail: "long" },
    })
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it("needs a prompt for Create your own", async () => {
    const bodies = captureCreates()
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)

    await user.click(tile("Reports"))
    await user.click(await screen.findByRole("button", { name: /^Create your own/ }))

    const form = await screen.findByRole("dialog", {
      name: "Customize Create your own",
    })
    const generate = within(form).getByRole("button", { name: "Generate" })
    expect(generate).toBeDisabled()

    const task = within(form).getByRole("textbox", {
      name: "What should the report contain?",
    })
    await user.click(task)
    await user.paste("Compare the two stages in a table")
    expect(generate).toBeEnabled()
    await user.click(generate)

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({
      kind: "report",
      options: { format: "custom", detail: "standard" },
      prompt: "Compare the two stages in a table",
    })
  })
})

describe("StudioPanel: limits and errors", () => {
  it("disables the tiles with the reset time when the daily budget is used up", async () => {
    useUsage(notebookUsageLimitReached)
    renderNotebook(<StudioPanel notebook={notebookDetail} />)

    const message = await screen.findByText(/Daily limit reached, resets at \d\d:\d\d\./)
    expect(message).toBeInTheDocument()
    await waitFor(() => expect(tile("Quiz")).toBeDisabled())
    expect(tile("Quiz")).toHaveAttribute("title", message.textContent ?? "")
  })

  it("uses the session wording when only the session budget is used up", async () => {
    useUsage({
      ...notebookUsage,
      budget: {
        ...notebookUsage.budget,
        session: {
          used: 1_500_000,
          limit: 1_500_000,
          resets_at: "2026-10-07T08:00:00Z",
        },
      },
    })
    renderNotebook(<StudioPanel notebook={notebookDetail} />)

    expect(await screen.findByText(/Session limit reached, available again at \d\d:\d\d\./)).toBeInTheDocument()
  })

  it("disables only the slide deck tile when its daily count is used up", async () => {
    useUsage({
      ...notebookUsage,
      quotas: {
        ...notebookUsage.quotas,
        slides: { used: 6, limit: 6, resets_at: "2026-10-08T00:00:00Z" },
      },
    })
    renderNotebook(<StudioPanel notebook={notebookDetail} />)

    await waitFor(() => expect(tile("Slide deck")).toBeDisabled())
    expect(tile("Slide deck")).toHaveAttribute("title", "Daily limit for “Slide deck” reached.")
    expect(tile("Quiz")).toBeEnabled()
    expect(screen.getByText("Daily limit for “Slide deck” reached.")).toBeInTheDocument()
  })

  it("disables every tile when the overall daily count is used up", async () => {
    useUsage({
      ...notebookUsage,
      quotas: {
        ...notebookUsage.quotas,
        artifacts: { used: 20, limit: 20, resets_at: "2026-10-08T00:00:00Z" },
      },
    })
    renderNotebook(<StudioPanel notebook={notebookDetail} />)

    await waitFor(() => expect(tile("Quiz")).toBeDisabled())
    expect(tile("Mind map")).toHaveAttribute("title", "Daily limit for “Study materials” reached.")
  })

  it("shows the quota hint only above 70 percent", async () => {
    const { unmount } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    await screen.findByRole("list", { name: "Studio items" })
    expect(screen.queryByText(/of 20 today/)).not.toBeInTheDocument()
    unmount()

    useUsage({
      ...notebookUsage,
      quotas: {
        ...notebookUsage.quotas,
        artifacts: { used: 15, limit: 20, resets_at: "2026-10-08T00:00:00Z" },
      },
    })
    renderNotebook(<StudioPanel notebook={notebookDetail} />)
    expect(await screen.findByText("Study materials: 15 of 20 today")).toBeInTheDocument()
  })

  it("disables the tiles while the browser is offline", async () => {
    setOnline(false)
    renderNotebook(<StudioPanel notebook={notebookDetail} />)

    expect(await screen.findByText("You are offline")).toBeInTheDocument()
    expect(tile("Quiz")).toBeDisabled()
  })

  it.each([
    [
      "notebooks/quota-exceeded",
      429,
      { kind: "slides", limit: 6, resets_at: "2026-10-08T00:00:00Z" },
      "Daily limit for “Slide deck” reached.",
    ],
    ["notebooks/busy", 409, {}, "Three items are already being created. Wait for one to finish."],
    [
      "notebooks/limit-reached",
      429,
      { scope: "day", resets_at: "2026-10-08T00:00:00Z" },
      /Daily limit reached, resets at \d\d:\d\d\./,
    ],
    ["notebooks/no-sources-selected", 422, {}, "Select at least one ready source first."],
    ["notebooks/invalid-options", 422, {}, "These options are not valid for this material."],
    ["notebooks/artifact-limit", 409, {}, "This notebook has too many study materials. Delete some first."],
  ] as const)("shows the message of %s inline when starting fails", async (type, status, params, expected) => {
    server.use(http.post(ARTIFACTS_URL, () => problem(status, type, params)))
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)

    await user.click(tile("Mind map"))

    const alert = await screen.findByRole("alert")
    if (typeof expected === "string") expect(alert).toHaveTextContent(expected)
    else expect(alert.textContent ?? "").toMatch(expected)
  })
})

describe("StudioPanel: shell", () => {
  it("shows the empty state for a notebook without outputs", async () => {
    server.use(http.get(ARTIFACTS_URL, () => HttpResponse.json([])))
    renderNotebook(<StudioPanel notebook={notebookDetail} />)

    expect(await screen.findByText("Studio results will be saved here.")).toBeInTheDocument()
  })

  it("shows a skeleton while the list loads", async () => {
    const gate = Promise.withResolvers<void>()
    server.use(
      http.get(ARTIFACTS_URL, async () => {
        await gate.promise
        return HttpResponse.json([])
      }),
    )
    renderNotebook(<StudioPanel notebook={notebookDetail} />)

    expect(await screen.findByRole("status", { name: "Loading" })).toHaveAttribute("aria-busy", "true")
    // The tiles work while the list loads.
    expect(tile("Quiz")).toBeEnabled()

    gate.resolve()
    expect(await screen.findByText("Studio results will be saved here.")).toBeInTheDocument()
  })

  it("shows an error with Try again when the list cannot be loaded", async () => {
    let calls = 0
    server.use(
      http.get(ARTIFACTS_URL, () => {
        calls += 1
        return calls === 1 ? problem(500, "common/internal") : HttpResponse.json([])
      }),
    )
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)

    await user.click(await screen.findByRole("button", { name: "Try again" }))

    expect(await screen.findByText("Studio results will be saved here.")).toBeInTheDocument()
  })

  it("opens the note editor from the Add note pill", async () => {
    const { user, actions } = renderNotebook(<StudioPanel notebook={notebookDetail} />)

    await user.click(screen.getByRole("button", { name: "Add note" }))

    expect(actions.openNoteEditor).toHaveBeenCalledTimes(1)
    expect(actions.openNoteEditor).toHaveBeenCalledWith()
  })

  it("shows the collapse button only when asked to", async () => {
    const onCollapse = mock(() => undefined)
    const { user, unmount } = renderNotebook(<StudioPanel notebook={notebookDetail} onCollapse={onCollapse} />)

    await user.click(screen.getByRole("button", { name: "Collapse Studio" }))
    expect(onCollapse).toHaveBeenCalledTimes(1)
    unmount()

    renderNotebook(<StudioPanel notebook={notebookDetail} />)
    expect(screen.queryByRole("button", { name: "Collapse Studio" })).not.toBeInTheDocument()
  })
})
