/** The phone chrome: the assistant opens from the header, the bar uses short labels, the page reserves room. */
import { describe, expect, it } from "bun:test"
import { resetConfig } from "@ihsp/config"
import { userMe } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { AssistantHeaderButton, AssistantLauncher } from "../features/assistant/assistant-launcher"
import { AdmissionShell } from "../features/shell/components/admission-shell"
import { tourKey } from "../features/steps"
import { renderAdmissionApp } from "./helpers"

describe("phone chrome", () => {
  it("ADM-FAB-1 has no floating assistant button: the header button opens the dock", async () => {
    window.localStorage.setItem(tourKey(userMe.id), JSON.stringify({ status: "done", step: 0, card: null, dot: null }))
    const { user } = renderAdmissionApp(
      <>
        <AssistantHeaderButton />
        <AssistantLauncher />
      </>,
    )
    expect(screen.queryByRole("button", { name: "Open assistant", hidden: true })).toBeNull()
    expect(screen.queryByRole("dialog")).toBeNull()
    await user.click(await screen.findByRole("button", { name: "AI assistant" }))
    expect(await screen.findByRole("dialog", { name: "Assistant" })).toBeInTheDocument()
  })

  it("ADM-FAB-2 renders short labels in the bottom bar and ADM-FAB-3 reserves phone bottom padding", async () => {
    window.__ENV__ = { ...(window.__ENV__ as object), OAUTH_CLIENT_ID: "admission" }
    resetConfig()
    renderAdmissionApp(
      <AdmissionShell>
        <p>page body</p>
      </AdmissionShell>,
    )
    expect(await screen.findByText("page body")).toBeInTheDocument()
    const bar = await screen.findByTestId("section-bottom-bar")
    for (const label of ["Today", "Profile", "Universities", "Essays", "Apply"]) {
      expect(within(bar).getByText(label)).toBeInTheDocument()
    }
    const reserve = screen.getByTestId("phone-bottom-reserve")
    expect(reserve.className).toContain("9.5rem")
    expect(reserve.className).toContain("md:hidden")
  })
})
