import { describe, expect, it, setDefaultTimeout } from "bun:test"
import type { PublishBody } from "@ihsp/api"
import { apiUrl, errorHandlers, ids, pendingChanges, server, versionItem2 } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { PublishPage } from "../features/publish/components/publish-page"
import { authorSession, readBody, renderLms } from "./helpers"

// The first render of a page in a cold test run takes several seconds.
setDefaultTimeout(60_000)

function renderPublish() {
  return renderLms(<PublishPage courseId={ids.course} />, {
    route: `/edit/publish/?id=${ids.course}`,
    session: authorSession,
  })
}

describe("publish page", () => {
  it("lists the pending changes with their kind and the MCP mark", async () => {
    renderPublish()
    const quiz = (await screen.findByText("Derivative rules quiz")).closest("li")
    const cards = screen.getByText("Key formulas").closest("li")
    expect(quiz).toHaveAttribute("data-change", "changed")
    expect(cards).toHaveAttribute("data-change", "added")
    expect(within(cards as HTMLElement).getByText("Via MCP")).toBeInTheDocument()
    expect(screen.getByText("1 added, 1 changed, 0 removed.")).toBeInTheDocument()
    expect(screen.getByText("The outline (sections or order of steps) changed.")).toBeInTheDocument()
  })

  it("publishes with the draft_seq the list was loaded with and the note", async () => {
    let body = null as PublishBody | null
    server.use(
      http.post(apiUrl("/v1/lms/courses/:id/publish"), async ({ request }) => {
        body = await readBody<PublishBody>(request)
        return HttpResponse.json({ ...versionItem2, number: 3, note: body.note ?? null })
      }),
    )
    const { user } = renderPublish()
    await user.type(await screen.findByLabelText("Note (optional)"), "Fixed question 3")
    await user.click(screen.getByRole("button", { name: "Publish" }))
    expect(await screen.findByText("Published as version 3. Students see it now.")).toBeInTheDocument()
    expect(body).toEqual({ draft_seq: pendingChanges.draft_seq, note: "Fixed question 3" })
  })

  it("leaves the note out when it is empty", async () => {
    let body = null as PublishBody | null
    server.use(
      http.post(apiUrl("/v1/lms/courses/:id/publish"), async ({ request }) => {
        body = await readBody<PublishBody>(request)
        return HttpResponse.json(versionItem2)
      }),
    )
    const { user } = renderPublish()
    await user.click(await screen.findByRole("button", { name: "Publish" }))
    await waitFor(() => expect(body).toEqual({ draft_seq: pendingChanges.draft_seq }))
  })

  it("asks to review again when the draft changed after the list was loaded (lms/draft-changed)", async () => {
    server.use(errorHandlers.draftChanged)
    let loads = 0
    server.use(
      http.get(apiUrl("/v1/lms/courses/:id/pending"), () => {
        loads += 1
        return HttpResponse.json({ ...pendingChanges, draft_seq: pendingChanges.draft_seq + loads - 1 })
      }),
    )
    const { user } = renderPublish()
    await user.click(await screen.findByRole("button", { name: "Publish" }))
    expect(
      await screen.findByText("The draft changed after you opened this page. Review the changes again."),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Published as version/)).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Review again" }))
    await waitFor(() => expect(loads).toBe(2))
    await waitFor(() =>
      expect(screen.queryByText(/The draft changed after you opened this page/)).not.toBeInTheDocument(),
    )
  })

  it("shows the live and the draft content side by side for a changed step", async () => {
    const { user } = renderPublish()
    const row = (await screen.findByText("Derivative rules quiz")).closest("li") as HTMLElement
    await user.click(within(row).getByRole("button", { name: "Show diff" }))
    const diff = await within(row).findByTestId("step-diff")
    expect(diff).toHaveTextContent("Live version")
    expect(diff).toHaveTextContent("Draft")
    // The fixture's live test block has no questions, the draft has three: the block is a changed row.
    expect(diff.querySelector('[data-status="changed"]')).not.toBeNull()
    expect(diff).toHaveTextContent("What is the derivative of x^2?")
  })

  it("disables Publish when nothing is pending", async () => {
    server.use(
      http.get(apiUrl("/v1/lms/courses/:id/pending"), () =>
        HttpResponse.json({ draft_seq: 3, outline_changed: false, steps: [] }),
      ),
    )
    renderPublish()
    expect(await screen.findByText("There are no pending changes.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Publish" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Discard all changes" })).toBeDisabled()
  })

  it("discards all pending changes after a confirmation", async () => {
    let discarded = false
    server.use(
      http.post(apiUrl("/v1/lms/courses/:id/discard"), () => {
        discarded = true
        return HttpResponse.json({ id: ids.course })
      }),
    )
    const { user } = renderPublish()
    await user.click(await screen.findByRole("button", { name: "Discard all changes" }))
    const dialog = await screen.findByRole("alertdialog")
    expect(discarded).toBe(false)
    await user.click(within(dialog).getByRole("button", { name: "Discard all changes" }))
    await waitFor(() => expect(discarded).toBe(true))
  })
})
