/** The phone chrome: the assistant button gives way to dialogs, the bar uses short labels, the page reserves room. */
import { describe, expect, it } from "bun:test"
import { resetConfig } from "@ihsp/config"
import { userMe } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { act } from "react"
import { AssistantLauncher } from "../features/assistant/assistant-launcher"
import { AdmissionShell } from "../features/shell/components/admission-shell"
import { tourKey } from "../features/steps"
import { renderAdmissionApp } from "./helpers"

describe("phone chrome", () => {
  it("ADM-FAB-1 hides the assistant button while a dialog is open", async () => {
    // A fresh visitor starts the tour in "intro", which also hides the button; the test is about dialogs only.
    window.localStorage.setItem(tourKey(userMe.id), JSON.stringify({ status: "done", step: 0, card: null, dot: null }))
    renderAdmissionApp(<AssistantLauncher />)
    const button = await screen.findByRole("button", { name: "Open assistant" })
    expect(button.className).not.toContain("hidden")
    const dialog = document.createElement("div")
    dialog.setAttribute("role", "dialog")
    dialog.setAttribute("data-state", "open")
    await act(async () => {
      document.body.appendChild(dialog)
    })
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Open assistant", hidden: true }).className).toContain("hidden"),
    )
    await act(async () => {
      dialog.remove()
    })
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Open assistant" }).className).not.toContain("hidden"),
    )
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
    for (const label of ["Career", "Activities", "Universities", "Essays", "Apply"]) {
      expect(within(bar).getByText(label)).toBeInTheDocument()
    }
    const reserve = screen.getByTestId("phone-bottom-reserve")
    expect(reserve.className).toContain("9.5rem")
    expect(reserve.className).toContain("md:hidden")
  })
})
