import { describe, expect, it, mock } from "bun:test"
import type { NotebookUsage } from "@ihsp/api"
import { apiUrl, notebookUsage, notebookUsageLimitReached, server } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { UsageDialog } from "./usage-dialog"

allowSlowRenders()

function useUsage(usage: NotebookUsage) {
  server.use(http.get(apiUrl("/v1/notebooks/usage"), () => HttpResponse.json(usage)))
}

function renderDialog() {
  return renderNotebook(<UsageDialog open onOpenChange={() => undefined} />)
}

describe("UsageDialog", () => {
  it("shows a skeleton while loading", async () => {
    const gate = Promise.withResolvers<void>()
    server.use(
      http.get(apiUrl("/v1/notebooks/usage"), async () => {
        await gate.promise
        return HttpResponse.json(notebookUsage)
      }),
    )
    renderDialog()

    expect(await screen.findByRole("dialog", { name: "Usage" })).toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true")

    gate.resolve()
    expect(await screen.findByRole("progressbar", { name: "This session" })).toBeInTheDocument()
  })

  it("shows the session and day meters with their reset times", async () => {
    useUsage(notebookUsage)
    renderDialog()

    const session = await screen.findByRole("progressbar", {
      name: "This session",
    })
    expect(session).toHaveAttribute("aria-valuenow", "8")
    const day = screen.getByRole("progressbar", { name: "Today" })
    expect(day).toHaveAttribute("aria-valuenow", "10")
    expect(screen.getByText("8% used")).toBeInTheDocument()
    expect(screen.getByText("10% used")).toBeInTheDocument()
    expect(screen.getAllByText(/^Resets at \d\d:\d\d$/)).toHaveLength(2)
  })

  it("lists the daily counters per kind and how many items are being created", async () => {
    useUsage({ ...notebookUsage, generating: 2 })
    renderDialog()

    const dialog = await screen.findByRole("dialog", { name: "Usage" })
    await within(dialog).findByText("Study materials: 6 of 20 today")
    expect(within(dialog).getByText("Slide deck: 1 of 6 today")).toBeInTheDocument()
    expect(within(dialog).getByText("Infographic: 1 of 6 today")).toBeInTheDocument()
    expect(within(dialog).queryByText(/Audio overview/) === null).toBe(true)
    expect(within(dialog).getByText("Being created now: 2 of 3")).toBeInTheDocument()
  })

  it("turns the meter red when the budget is used up", async () => {
    useUsage(notebookUsageLimitReached)
    renderDialog()

    const day = await screen.findByRole("progressbar", { name: "Today" })
    expect(day).toHaveAttribute("aria-valuenow", "100")
    expect(day.className).toContain("bg-destructive")
    expect(screen.getByText("Resets at 05:00")).toBeInTheDocument()
  })

  it("keeps the meter neutral below 80 percent and amber from 80 percent", async () => {
    useUsage({
      ...notebookUsage,
      budget: {
        session: {
          used: 1_200_000,
          limit: 1_500_000,
          resets_at: "2026-10-07T08:00:00Z",
        },
        day: {
          used: 400_000,
          limit: 4_000_000,
          resets_at: "2026-10-08T00:00:00Z",
        },
      },
    })
    renderDialog()

    const session = await screen.findByRole("progressbar", {
      name: "This session",
    })
    expect(session.className).toContain("bg-amber-500")
    expect(screen.getByRole("progressbar", { name: "Today" }).className).not.toContain("bg-amber-500")
  })

  it("shows an error with Try again when the usage cannot be loaded", async () => {
    let calls = 0
    server.use(
      http.get(apiUrl("/v1/notebooks/usage"), () => {
        calls += 1
        return calls === 1 ? new HttpResponse(null, { status: 500 }) : HttpResponse.json(notebookUsage)
      }),
    )
    const { user } = renderDialog()

    await user.click(await screen.findByRole("button", { name: "Try again" }))

    expect(await screen.findByRole("progressbar", { name: "This session" })).toBeInTheDocument()
  })

  it("asks to close through the close button", async () => {
    const onOpenChange = mock(() => undefined)
    useUsage(notebookUsage)
    const { user } = renderNotebook(<UsageDialog open onOpenChange={onOpenChange} />)

    await user.click(await screen.findByRole("button", { name: "Close" }))

    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything())
  })
})
