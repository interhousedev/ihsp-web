import { describe, expect, it, setDefaultTimeout } from "bun:test"
import { apiUrl, ids, server, versionCompare } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { ComparePage } from "../features/versions/components/compare-page"
import { VersionViewPage } from "../features/versions/components/version-view-page"
import { VersionsPage } from "../features/versions/components/versions-page"
import { authorSession, renderLms } from "./helpers"

// The first render of a page in a cold test run takes several seconds.
setDefaultTimeout(60_000)

describe("versions", () => {
  it("lists versions newest first, marks the live one and summarises the changes", async () => {
    renderLms(<VersionsPage courseId={ids.course} />, {
      route: `/edit/versions/?id=${ids.course}`,
      session: authorSession,
    })
    const second = (await screen.findByText("Version 2")).closest("li") as HTMLElement
    expect(within(second).getByText("Live")).toBeInTheDocument()
    expect(within(second).getByText("Added the quiz")).toBeInTheDocument()
    expect(within(second).getByText("1 added, outline changed")).toBeInTheDocument()
    expect(screen.getByText("Version 1")).toBeInTheDocument()
  })

  it("compares two selected versions and restores one after a confirmation", async () => {
    let restored = null as string | null
    server.use(
      http.post(apiUrl("/v1/lms/courses/:id/versions/:number/restore"), ({ params }) => {
        restored = String(params.number)
        return HttpResponse.json({ id: ids.course })
      }),
    )
    const { user } = renderLms(<VersionsPage courseId={ids.course} />, {
      route: `/edit/versions/?id=${ids.course}`,
      session: authorSession,
    })
    await user.click(await screen.findByLabelText("Select version 2 for comparing"))
    expect(screen.getByRole("button", { name: "Compare selected" })).toBeDisabled()
    await user.click(screen.getByLabelText("Select version 1 for comparing"))
    const link = screen.getByRole("link", { name: "Compare selected" })
    expect(link.getAttribute("href")).toContain(`id=${ids.course}&a=1&b=2`)

    const first = screen.getByText("Version 1").closest("li") as HTMLElement
    await user.click(within(first).getByRole("button", { name: "Restore" }))
    const dialog = await screen.findByRole("alertdialog")
    await user.click(within(dialog).getByRole("button", { name: "Restore" }))
    await waitFor(() => expect(restored).toBe("1"))
    expect(await screen.findByText("The version is in the draft now.")).toBeInTheDocument()
  })

  it("opens one version read-only with its outline", async () => {
    renderLms(<VersionViewPage courseId={ids.course} number={2} />, {
      route: `/edit/versions/view/?id=${ids.course}&n=2`,
      session: authorSession,
    })
    expect(await screen.findByText("A short course on limits and derivatives.")).toBeInTheDocument()
    expect(screen.getByText("Introduction")).toBeInTheDocument()
    expect(screen.getByText("Derivative rules quiz")).toBeInTheDocument()
    expect(screen.getByText(/Read-only/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Restore" })).toBeInTheDocument()
  })
})

const rowOf = (title: string) => screen.getByText(title).closest("li") as HTMLElement

describe("compare", () => {
  it("highlights the steps that differ and dims the others", async () => {
    server.use(
      http.get(apiUrl("/v1/lms/courses/:id/compare"), () =>
        HttpResponse.json({
          ...versionCompare,
          steps: [
            {
              step_id: "s1",
              title: "Unchanged step",
              change: "same",
              revision_a: "aaaaaaaa-1",
              revision_b: "aaaaaaaa-1",
            },
            {
              step_id: "s2",
              title: "Edited step",
              change: "changed",
              revision_a: "bbbbbbbb-1",
              revision_b: "cccccccc-2",
            },
            { step_id: "s3", title: "New step", change: "added", revision_a: null, revision_b: "dddddddd-3" },
            { step_id: "s4", title: "Dropped step", change: "removed", revision_a: "eeeeeeee-4", revision_b: null },
          ],
        }),
      ),
    )
    renderLms(<ComparePage courseId={ids.course} a={1} b={2} />, {
      route: `/edit/compare/?id=${ids.course}&a=1&b=2`,
      session: authorSession,
    })
    expect(await screen.findByText("3 steps differ")).toBeInTheDocument()
    expect(rowOf("Unchanged step")).toHaveAttribute("data-change", "same")
    expect(rowOf("Unchanged step").className).toContain("text-muted-foreground")
    expect(rowOf("Edited step")).toHaveAttribute("data-change", "changed")
    expect(rowOf("Edited step").className).toContain("border-amber-500")
    expect(rowOf("New step").className).toContain("border-emerald-500")
    expect(rowOf("Dropped step").className).toContain("border-red-500")
    expect(within(rowOf("Edited step")).getByText(/v1: bbbbbbbb → v2: cccccccc/)).toBeInTheDocument()
    expect(within(rowOf("Unchanged step")).queryByText(/v1:/)).not.toBeInTheDocument()
  })

  it("says when the versions are identical", async () => {
    server.use(
      http.get(apiUrl("/v1/lms/courses/:id/compare"), () =>
        HttpResponse.json({
          ...versionCompare,
          steps: [{ step_id: "s1", title: "Same", change: "same", revision_a: "x", revision_b: "x" }],
        }),
      ),
    )
    renderLms(<ComparePage courseId={ids.course} a={1} b={2} />, {
      route: `/edit/compare/?id=${ids.course}&a=1&b=2`,
      session: authorSession,
    })
    expect(await screen.findByText("The two versions are identical.")).toBeInTheDocument()
  })
})
