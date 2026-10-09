import { describe, expect, it } from "bun:test"
import { setLibraryActor, userMe } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { allowSlowRenders, renderLibrary } from "../../test-support"
import { ReportsPage } from "./reports-page"

allowSlowRenders()

const REPORTED = "Fizika: kinematika boʻyicha konspekt"
const HELD = "Newton's laws: practice set"

function renderReports() {
  setLibraryActor("librarian2")
  return renderLibrary(<ReportsPage />, {
    route: "/manage/reports/",
    session: { user: { ...userMe, roles: ["student", "librarian"] } },
  })
}

describe("ReportsPage", () => {
  it("lists the open reports and the items held after reports, with their reasons", async () => {
    renderReports()

    const open = await screen.findByRole("region", { name: "Open reports" })
    expect(within(open).getByRole("link", { name: REPORTED })).toBeInTheDocument()
    expect(within(open).getByText("1 × Mistake in the content")).toBeInTheDocument()
    const held = screen.getByRole("region", { name: "Held after reports" })
    expect(await within(held).findByRole("link", { name: HELD })).toBeInTheDocument()
    expect(within(held).getByText("2 × Copyright")).toBeInTheDocument()
  })

  it("resolves a report with a decision: the item leaves the list and the result is announced", async () => {
    const { user } = renderReports()
    const open = await screen.findByRole("region", { name: "Open reports" })

    await user.click(await within(open).findByRole("button", { name: new RegExp(`^Resolve.*${REPORTED}`) }))
    const dialog = await screen.findByRole("dialog", { name: "Resolve reports" })
    expect(within(dialog).getAllByRole("radio")).toHaveLength(4)
    await user.click(within(dialog).getByRole("radio", { name: /^Dismiss/ }))
    await user.click(within(dialog).getByRole("button", { name: "Resolve" }))

    expect(await screen.findByText(`Reports resolved: ${REPORTED}`)).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole("link", { name: REPORTED })).not.toBeInTheDocument())
  })

  it("restores a held item by dismissing its reports", async () => {
    const { user } = renderReports()
    const held = await screen.findByRole("region", { name: "Held after reports" })

    await user.click(await within(held).findByRole("button", { name: new RegExp(`^Resolve.*${HELD}`) }))
    const dialog = await screen.findByRole("dialog", { name: "Resolve reports" })
    await user.click(within(dialog).getByRole("button", { name: "Resolve" }))

    expect(await screen.findByText(`Reports resolved: ${HELD}`)).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole("link", { name: HELD })).not.toBeInTheDocument())
  })
})
