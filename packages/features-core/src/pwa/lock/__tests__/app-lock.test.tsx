/** The shared app lock: the Settings card (off by default, PIN set and removed) and the gate that covers the app. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { resetConfig } from "@ihsp/config"
import { TEST_ENV, renderWithProviders, userMe } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { AppLockSection } from "../app-lock-section"
import { PinGate } from "../pin-gate"
import { createPinRecord } from "../pin"
import { clearPinRecord, readPinRecord, writePinRecord } from "../pin-storage"

function setMode(mode: "web" | "pwa"): void {
  window.__ENV__ = { ...TEST_ENV, APP_MODE: mode }
  resetConfig()
}

beforeEach(() => {
  window.localStorage.clear()
  window.sessionStorage.clear()
  setMode("pwa")
})
afterEach(() => clearPinRecord(userMe.id))

describe("the Settings card", () => {
  test("is off by default and absent outside the installed app", () => {
    setMode("web")
    const { unmount } = renderWithProviders(<AppLockSection />)
    expect(screen.queryByText("App lock")).not.toBeInTheDocument()
    unmount()

    setMode("pwa")
    renderWithProviders(<AppLockSection />)
    expect(screen.getByText("App lock is off.")).toBeInTheDocument()
    expect(readPinRecord(userMe.id)).toBeNull()
  })

  test("sets a PIN for the signed-in user", async () => {
    const { user } = renderWithProviders(<AppLockSection />)
    await user.click(screen.getByRole("button", { name: "Set a PIN" }))
    fireEvent.change(await screen.findByLabelText("New PIN (4 to 6 digits)"), { target: { value: "4821" } })
    fireEvent.change(screen.getByLabelText("Repeat the new PIN"), { target: { value: "4821" } })
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(readPinRecord(userMe.id)).not.toBeNull())
    expect(screen.getByText("App lock is on.", { selector: "p" })).toBeInTheDocument()
  })
})

describe("the gate", () => {
  test("covers the app when the user has a PIN, and not when there is none", async () => {
    const { unmount } = renderWithProviders(
      <PinGate>
        <button type="button">app</button>
      </PinGate>,
    )
    expect(screen.queryByText("IHT is locked")).not.toBeInTheDocument()
    unmount()

    writePinRecord(userMe.id, await createPinRecord("4821", 1000))
    renderWithProviders(
      <PinGate>
        <button type="button">app</button>
      </PinGate>,
    )
    expect(await screen.findByText("IHT is locked")).toBeInTheDocument()
  })
})
