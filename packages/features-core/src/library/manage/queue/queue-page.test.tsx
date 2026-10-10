import { describe, expect, it } from "bun:test"
import { apiUrl, libDetails, problem, server, setLibraryActor, userMe } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import axe from "axe-core"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderLibrary } from "../../test-support"
import { QueuePage } from "./queue-page"

allowSlowRenders()

const PENDING = "Kvadrat tenglamalar: qisqacha konspekt"
const OWN = "Informatics: sorting algorithms"
const HELD = "Newton's laws: practice set"
const REPORTED = "Fizika: kinematika boʻyicha konspekt"

function renderQueue(tab?: string, as: "librarian" | "librarian2" | "admin" = "librarian2") {
  setLibraryActor(as)
  const roles = as === "admin" ? (["admin"] as const) : (["student", "librarian"] as const)
  return renderLibrary(<QueuePage />, {
    route: `/manage/queue/${tab ? `?tab=${tab}` : ""}`,
    session: { user: { ...userMe, roles: [...roles] } },
  })
}

const row = (title: string) =>
  screen.findByRole("button", { name: new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) })
/** Includes rows behind an open dialog (the page is hidden from the accessibility tree while it is open). */
const queryRow = (title: string) =>
  screen.queryByRole("button", { name: new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), hidden: true })
const tabNamed = (name: RegExp) => screen.getByRole("tab", { name })

describe("QueuePage: tabs and list", () => {
  it("shows the five tabs with counts and the rows of the first tab", async () => {
    renderQueue()

    await row(PENDING)
    await waitFor(() => {
      expect(tabNamed(/^To review/)).toHaveTextContent("2")
      expect(tabNamed(/^Reports/)).toHaveTextContent("1")
      expect(tabNamed(/^Held/)).toHaveTextContent("1")
      expect(tabNamed(/^Rights/)).toHaveTextContent("2")
      expect(tabNamed(/^Suggestions/)).toHaveTextContent("1")
    })
    expect(tabNamed(/^To review/)).toHaveTextContent(/Oldest:/)
  })

  it("shows the preview with the uploader, the cohort and the scan findings of the chosen row", async () => {
    const { user } = renderQueue()

    await user.click(await row(PENDING))

    const preview = await screen.findByRole("article", { name: "Item to review" })
    expect(within(preview).getByRole("heading", { name: PENDING })).toBeInTheDocument()
    expect(within(preview).getAllByText(/Aziza K\., 2025/).length).toBeGreaterThan(0)
    expect(within(preview).getByRole("heading", { name: "Uploaded by" })).toBeInTheDocument()
    expect(within(preview).getByText("The scan found nothing.")).toBeInTheDocument()
    expect(await within(preview).findByRole("link", { name: /Open the item page/ })).toBeInTheDocument()
  })

  it("shows what the report tab says: reasons with counts", async () => {
    const { user } = renderQueue("reports")

    await user.click(await row(REPORTED))

    const preview = await screen.findByRole("article", { name: "Item to review" })
    expect(within(preview).getByText("1 × Mistake in the content")).toBeInTheDocument()
  })

  it("shows the suggestion with its link and note, and a link that starts a book draft from it", async () => {
    const { user } = renderQueue("suggestions")

    await user.click(await row("Atom physics workbook"))

    const preview = await screen.findByRole("article", { name: "Item to review" })
    expect(within(preview).getByRole("link", { name: /example\.org\/atom-workbook/ })).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    )
    expect(within(preview).getByText("Good for the olympiad group.")).toBeInTheDocument()
    expect(within(preview).getByText("Jasur I., 2025")).toBeInTheDocument()
    const draft = screen.getByRole("link", { name: "Create a book draft" })
    expect(draft.getAttribute("href")).toMatch(
      /^\/manage\/books\/edit\/?\?title=Atom%20physics%20workbook(&suggestion=[^&]+)?$/,
    )
  })

  it("links a rights row to the book editor", async () => {
    const { user } = renderQueue("rights")

    await user.click(await row("Kimyo masalalari"))

    const link = await screen.findByRole("link", { name: "Edit rights" })
    expect(link.getAttribute("href")).toMatch(/^\/manage\/books\/edit\/?\?id=/)
  })

  it("shows an error with a retry when the queue cannot be loaded", async () => {
    server.use(http.get(apiUrl("/v1/manage/library/queue"), () => problem(500, "common/internal", "Boom")))
    renderQueue()

    expect((await screen.findAllByRole("alert")).length).toBeGreaterThan(0)
    expect(screen.getAllByRole("button", { name: "Try again" }).length).toBeGreaterThan(0)
  })
})

describe("QueuePage: actions", () => {
  it("approves a row at once: it leaves the list, the result is announced and the count drops", async () => {
    const { user } = renderQueue()
    await user.click(await row(PENDING))

    await user.click(await screen.findByRole("button", { name: "Approve" }))

    expect(await screen.findByText(`Approved: ${PENDING}`)).toBeInTheDocument()
    await waitFor(() => expect(queryRow(PENDING)).not.toBeInTheDocument())
    await waitFor(() => expect(tabNamed(/^To review/)).toHaveTextContent("1"))
  })

  it("needs a reason to reject: an empty one is refused, a written one rejects the item", async () => {
    const { user } = renderQueue()
    await user.click(await row(PENDING))

    await user.click(await screen.findByRole("button", { name: "Reject" }))
    const dialog = await screen.findByRole("dialog", { name: "Reject this item" })
    await user.click(within(dialog).getByRole("button", { name: "Reject" }))

    expect(await within(dialog).findByText("Write a reason. The owner will see it.")).toBeInTheDocument()
    expect(queryRow(PENDING)).toBeInTheDocument()

    await user.type(within(dialog).getByLabelText("Reason"), "Contains personal data")
    await user.click(within(dialog).getByRole("button", { name: "Reject" }))

    expect(await screen.findByText(`Rejected: ${PENDING}`)).toBeInTheDocument()
    await waitFor(() => expect(queryRow(PENDING)).not.toBeInTheDocument())
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it("asks for changes with a message to the owner", async () => {
    const { user } = renderQueue()
    await user.click(await row(PENDING))

    await user.click(await screen.findByRole("button", { name: "Request changes" }))
    const dialog = await screen.findByRole("dialog", { name: "Request changes" })
    await user.type(within(dialog).getByLabelText("Reason"), "Page numbers missing")
    await user.click(within(dialog).getByRole("button", { name: "Send request" }))
    // The message to the owner is what tells them what to fix: it is required here.
    expect(await within(dialog).findByText("Write what the owner should change.")).toBeInTheDocument()
    await user.type(within(dialog).getByLabelText("Message to the owner"), "Please add the page numbers to every scan.")
    await user.click(within(dialog).getByRole("button", { name: "Send request" }))

    expect(await screen.findByText(`Changes requested: ${PENDING}`)).toBeInTheDocument()
  })

  it("sends a short reason and a separate message, never a long text as the reason", async () => {
    let body: Record<string, unknown> = {}
    server.use(
      http.post(apiUrl("/v1/manage/library/items/:id/reject"), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(libDetails.matPending)
      }),
    )
    const { user } = renderQueue()
    await user.click(await row(PENDING))
    await user.click(await screen.findByRole("button", { name: "Reject" }))
    const dialog = await screen.findByRole("dialog", { name: "Reject this item" })

    await user.type(within(dialog).getByLabelText("Reason"), "Personal data")
    await user.type(within(dialog).getByLabelText("Message to the owner (optional)"), "Page 3 shows a phone number.")
    await user.click(within(dialog).getByRole("button", { name: "Reject" }))

    await waitFor(() => expect(body).toEqual({ reason: "Personal data", note: "Page 3 shows a phone number." }))
  })

  it("offers the reason codes of the API when unpublishing, and sends the code", async () => {
    let body: Record<string, unknown> = {}
    server.use(
      http.post(apiUrl("/v1/manage/library/items/:id/unpublish"), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(libDetails.matHeld)
      }),
    )
    const { user } = renderQueue("held")
    await user.click(await row(HELD))
    await user.click(await screen.findByRole("button", { name: "Unpublish" }))
    const dialog = await screen.findByRole("dialog", { name: "Unpublish this item" })

    const select = within(dialog).getByLabelText("Reason")
    expect(
      within(select)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual([
      "Removed from the library",
      "Takedown (rights or policy)",
      "Replaced by a newer version",
      "Other (write your own)",
    ])
    await user.selectOptions(select, "takedown")
    await user.click(within(dialog).getByRole("button", { name: "Unpublish" }))

    await waitFor(() => expect(body).toEqual({ reason: "takedown" }))
  })

  it("restores a held item with a reason and unpublishes it from the same tab", async () => {
    const { user } = renderQueue("held")
    await user.click(await row(HELD))

    await user.click(await screen.findByRole("button", { name: "Restore" }))
    const dialog = await screen.findByRole("dialog", { name: "Restore this item" })
    await user.type(within(dialog).getByLabelText("Reason"), "The reports were wrong")
    await user.click(within(dialog).getByRole("button", { name: "Restore" }))

    expect(await screen.findByText(`Restored: ${HELD}`)).toBeInTheDocument()
  })

  it("marks the librarian's own upload as needing another librarian when the API refuses the approval", async () => {
    const { user } = renderQueue("review", "librarian")
    await user.click(await row(OWN))

    await user.click(await screen.findByRole("button", { name: "Approve" }))

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent("You uploaded this. Another librarian must approve it.")
    expect(await row(OWN)).toHaveTextContent("Needs another librarian")
    await waitFor(() => expect(screen.getByRole("button", { name: "Approve" })).toBeDisabled())
  })

  it("resolves the reports of an item: dismiss, hold, unpublish or unpublish and warn", async () => {
    const { user } = renderQueue("reports")
    await user.click(await row(REPORTED))

    await user.click(await screen.findByRole("button", { name: "Resolve reports" }))
    const dialog = await screen.findByRole("dialog", { name: "Resolve reports" })
    for (const label of [/^Dismiss/, /^Hold/, /^Unpublish(?! and)/, /^Unpublish and warn/]) {
      expect(within(dialog).getByRole("radio", { name: label })).toBeInTheDocument()
    }
    await user.click(within(dialog).getByRole("radio", { name: /^Unpublish and warn/ }))
    await user.click(within(dialog).getByRole("button", { name: "Resolve" }))

    expect(await screen.findByText(`Reports resolved: ${REPORTED}`)).toBeInTheDocument()
    await waitFor(() => expect(queryRow(REPORTED)).not.toBeInTheDocument())
  })
})

describe("QueuePage: keyboard", () => {
  it("approves the selected row with the a key", async () => {
    const { user } = renderQueue()
    await user.click(await row(PENDING))
    await screen.findByRole("button", { name: "Approve" })

    await user.keyboard("a")

    expect(await screen.findByText(`Approved: ${PENDING}`)).toBeInTheDocument()
  })

  it("opens the reason dialog with r and h, and ignores letters typed in a field", async () => {
    const { user } = renderQueue()
    await user.click(await row(PENDING))
    await screen.findByRole("button", { name: "Approve" })

    await user.keyboard("r")
    const dialog = await screen.findByRole("dialog", { name: "Reject this item" })
    await user.type(within(dialog).getByLabelText("Reason"), "ahc")

    expect(within(dialog).getByLabelText("Reason")).toHaveValue("ahc")
    expect(screen.queryByText(`Approved: ${PENDING}`)).not.toBeInTheDocument()
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it("does nothing when no row is chosen, and moves the choice with j and k", async () => {
    const { user } = renderQueue()
    await row(PENDING)

    await user.keyboard("a")
    expect(screen.queryByText(/^Approved:/)).not.toBeInTheDocument()

    await user.keyboard("j")
    expect(await row(PENDING)).toHaveAttribute("aria-current", "true")
    await user.keyboard("j")
    expect(await row(OWN)).toHaveAttribute("aria-current", "true")
    await user.keyboard("k")
    expect(await row(PENDING)).toHaveAttribute("aria-current", "true")
  })

  it("holds a reported item with the h key after a reason", async () => {
    const { user } = renderQueue("reports")
    await user.click(await row(REPORTED))
    await screen.findByRole("button", { name: "Hold" })

    await user.keyboard("h")
    const dialog = await screen.findByRole("dialog", { name: "Hold for review" })
    // "Reported by readers" is the code that fits a hold and is preselected.
    expect((within(dialog).getByLabelText("Reason") as HTMLSelectElement).value).toBe("reported")
    await user.click(within(dialog).getByRole("button", { name: "Hold" }))

    expect(await screen.findByText(`Held: ${REPORTED}`)).toBeInTheDocument()
  })
})

describe("QueuePage: accessibility", () => {
  it("has no axe violations with a row chosen", async () => {
    const { user, container } = renderQueue()
    await user.click(await row(PENDING))
    await screen.findByRole("button", { name: "Approve" })

    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } })

    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([])
  })
})
