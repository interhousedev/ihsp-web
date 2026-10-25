/** The app lock: PIN on launch and after 5 minutes in the background, five wrong tries or "Forgot PIN" sign out. */
import { afterEach, beforeEach, describe, expect, setSystemTime, spyOn, test } from "bun:test"
import { navigation, useAuthStore } from "@ihsp/auth"
import { apiUrl, logoutResponse, server, userMe } from "@ihsp/test-utils"
import { act, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { configureTests } from "../../../tests/helpers"
import { PinGate } from "../components/pin-gate"
import { PwaRuntime } from "../components/pwa-runtime"
import { RELOCK_DELAY_MS, RELOCK_OPTIONS, writeActiveMarker, type RelockOption } from "../utils/lock-policy"
import { saveOfflineSession } from "../utils/offline-session"
import { PIN_MAX_ATTEMPTS, createPinRecord } from "../utils/pin"
import { readPinRecord, writePinRecord } from "../utils/pin-storage"
import { renderPwa, setRuntimeConfig } from "./pwa-test-support"

configureTests()

const PIN = "4821"
const APP = "the app itself"

beforeEach(async () => {
  setRuntimeConfig("pwa")
  server.use(http.get(apiUrl("/v1/app/version"), () => HttpResponse.json({ latest: "1.0.0", min_supported: "1.0.0" })))
  // A user with a PIN who used the app before: remembered for the first paint, and with the PIN stored.
  saveOfflineSession(userMe)
  writePinRecord(userMe.id, await createPinRecord(PIN, 1000))
})

afterEach(() => {
  setSystemTime()
  Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true })
})

function renderApp() {
  return renderPwa(
    <>
      <PwaRuntime />
      <PinGate>
        <button type="button">{APP}</button>
      </PinGate>
    </>,
  )
}

async function typePin(user: ReturnType<typeof renderApp>["user"], pin: string) {
  for (const digit of pin) await user.click(screen.getByRole("button", { name: digit }))
}

function goToBackground(): void {
  Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true })
  document.dispatchEvent(new Event("visibilitychange"))
}

function comeBack(): void {
  Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true })
  document.dispatchEvent(new Event("visibilitychange"))
}

describe("at launch", () => {
  test("the app is covered by the lock screen and cannot be reached", () => {
    renderApp()

    expect(screen.getByRole("dialog", { name: "IHT is locked" })).toBeInTheDocument()
    expect(screen.getByText("Enter your PIN")).toBeInTheDocument()
    expect(screen.getByText(APP).closest("[inert]")).not.toBeNull()
  })

  test("the right PIN opens the app, and opens it at the last digit with no button to press", async () => {
    const { user } = renderApp()

    await typePin(user, PIN)

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(screen.getByText(APP).closest("[inert]")).toBeNull()
  })

  test("a wrong PIN says how many tries are left and starts over", async () => {
    const { user } = renderApp()

    await typePin(user, "1111")

    expect(await screen.findByText("Wrong PIN. 4 attempts left.")).toBeInTheDocument()
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(readPinRecord(userMe.id)?.failed).toBe(1)
    await typePin(user, "2222")
    expect(await screen.findByText("Wrong PIN. 3 attempts left.")).toBeInTheDocument()
  })

  test("the right PIN after a wrong one clears the count", async () => {
    const { user } = renderApp()
    await typePin(user, "1111")
    await screen.findByText("Wrong PIN. 4 attempts left.")

    await typePin(user, PIN)

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(readPinRecord(userMe.id)?.failed).toBe(0)
  })

  test("the tries survive a reload: they are stored", async () => {
    const first = renderApp()
    await typePin(first.user, "1111")
    await screen.findByText("Wrong PIN. 4 attempts left.")
    first.unmount()

    renderApp()

    expect(readPinRecord(userMe.id)?.failed).toBe(1)
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  test("the PIN can be typed on a keyboard too", async () => {
    renderApp()

    for (const key of PIN) act(() => void window.dispatchEvent(new KeyboardEvent("keydown", { key })))

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  test("Backspace and the delete key remove the last digit", async () => {
    const { user } = renderApp()

    await user.click(screen.getByRole("button", { name: "1" }))
    expect(screen.getByRole("img", { name: "PIN, 1 of 4 digits entered" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Delete the last digit" }))

    expect(screen.getByRole("img", { name: "PIN, 0 of 4 digits entered" })).toBeInTheDocument()
  })

  test("no PIN, no lock", () => {
    window.localStorage.removeItem(`ihsp.pwa.pin.${userMe.id}`)

    renderApp()

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(screen.getByText(APP)).toBeInTheDocument()
  })

  test("the portal has no lock, even if a PIN is stored", () => {
    setRuntimeConfig("sp")

    renderApp()

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(screen.getByText(APP).closest("[inert]")).toBeNull()
  })

  test("a reload soon after unlocking stays unlocked; a new launch does not", () => {
    writeActiveMarker(Date.now() - 60_000)

    const reload = renderApp()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    reload.unmount()

    window.sessionStorage.clear()
    renderApp()
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })
})

describe("after 5 minutes in the background", () => {
  test("coming back after a quick look at another app does not lock", async () => {
    writeActiveMarker()
    renderApp()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()

    act(goToBackground)
    setSystemTime(new Date(Date.now() + 60_000))
    act(comeBack)

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  test("coming back after 5 minutes asks for the PIN again", async () => {
    writeActiveMarker()
    const { user } = renderApp()

    act(goToBackground)
    setSystemTime(new Date(Date.now() + (RELOCK_DELAY_MS["5m"] as number)))
    act(comeBack)

    expect(await screen.findByRole("dialog", { name: "IHT is locked" })).toBeInTheDocument()
    await typePin(user, PIN)
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })
})

function spyOnNavigation() {
  return spyOn(navigation, "assign").mockImplementation(() => undefined)
}

/** The PIN of the test user, set up with another "ask again" delay. */
async function useRelock(relock: RelockOption) {
  writePinRecord(userMe.id, await createPinRecord(PIN, 1000, relock))
}

describe("ask for the PIN again: every option", () => {
  // The clock stands still, so "one millisecond short of the delay" is exact.
  beforeEach(() => setSystemTime(new Date("2026-10-08T10:00:00Z")))

  const MINUTE = 60 * 1000
  const AWAY: [RelockOption, number][] = [
    ["immediately", 0],
    ["1m", MINUTE],
    ["5m", 5 * MINUTE],
    ["15m", 15 * MINUTE],
    ["1h", 60 * MINUTE],
  ]

  for (const [option, delay] of AWAY) {
    test(`${option}: locks after ${delay / MINUTE} minutes in the background`, async () => {
      await useRelock(option)
      writeActiveMarker()
      renderApp()

      act(goToBackground)
      setSystemTime(new Date(Date.now() + delay))
      act(comeBack)

      expect(await screen.findByRole("dialog", { name: "IHT is locked" })).toBeInTheDocument()
    })

    if (delay > 0) {
      test(`${option}: does not lock a minute-and-a-bit short of that`, async () => {
        await useRelock(option)
        writeActiveMarker()
        renderApp()

        act(goToBackground)
        setSystemTime(new Date(Date.now() + delay - 1))
        act(comeBack)

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      })
    }
  }

  test("never: does not lock after a day in the background, but a new start does", async () => {
    await useRelock("never")
    writeActiveMarker()
    const running = renderApp()

    act(goToBackground)
    setSystemTime(new Date(Date.now() + 24 * 60 * MINUTE))
    act(comeBack)

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    running.unmount()
    window.sessionStorage.clear()
    renderApp()
    expect(screen.getByRole("dialog", { name: "IHT is locked" })).toBeInTheDocument()
  })

  test("a record with every option is read back with that option", async () => {
    for (const option of RELOCK_OPTIONS) {
      await useRelock(option)
      expect(readPinRecord(userMe.id)?.relock).toBe(option)
    }
  })
})

describe("signing out", () => {
  test("the fifth wrong PIN signs the user out and removes the PIN", async () => {
    const assign = spyOnNavigation()
    const { user } = renderApp()

    for (let attempt = 1; attempt < PIN_MAX_ATTEMPTS; attempt += 1) {
      await typePin(user, "1111")
      await screen.findByText(
        `Wrong PIN. ${PIN_MAX_ATTEMPTS - attempt} ${attempt === 4 ? "attempt" : "attempts"} left.`,
      )
    }
    await typePin(user, "1111")

    // The sign-out finishes at once here, so the lock screen is already gone with the session.
    await waitFor(() => expect(assign).toHaveBeenCalledWith(expect.stringContaining("/oauth2/sessions/logout")))
    expect(readPinRecord(userMe.id)).toBeNull()
    expect(useAuthStore.getState().status).toBe("anonymous")
  })

  test("a user who used up the tries and reopens the app is signed out at once", async () => {
    const assign = spyOnNavigation()
    writePinRecord(userMe.id, { ...(await createPinRecord(PIN, 1000)), failed: PIN_MAX_ATTEMPTS })

    renderApp()

    await waitFor(() => expect(assign).toHaveBeenCalled())
    expect(readPinRecord(userMe.id)).toBeNull()
  })

  test("Forgot PIN asks first, then signs out and removes the PIN", async () => {
    const assign = spyOnNavigation()
    const { user } = renderApp()

    await user.click(screen.getByRole("button", { name: "Forgot PIN?" }))
    expect(await screen.findByText(/You will be signed out on this device/)).toBeInTheDocument()
    expect(assign).not.toHaveBeenCalled()
    expect(readPinRecord(userMe.id)).not.toBeNull()
    await user.click(screen.getByRole("button", { name: "Sign out" }))

    await waitFor(() => expect(assign).toHaveBeenCalledWith(expect.stringContaining("/oauth2/sessions/logout")))
    expect(readPinRecord(userMe.id)).toBeNull()
  })

  test("Cancel keeps the lock and the PIN", async () => {
    const { user } = renderApp()

    await user.click(screen.getByRole("button", { name: "Forgot PIN?" }))
    await user.click(await screen.findByRole("button", { name: "Cancel" }))

    await waitFor(() => expect(screen.queryByText(/You will be signed out on this device/)).not.toBeInTheDocument())
    expect(readPinRecord(userMe.id)).not.toBeNull()
    expect(screen.getByRole("dialog", { name: "IHT is locked" })).toBeInTheDocument()
  })

  test("offline, the sign-out fails: the app stays locked, keeps the PIN and retries when the network is back", async () => {
    const assign = spyOnNavigation()
    server.use(http.post(apiUrl("/v1/oauth/logout"), () => HttpResponse.error()))
    const { user } = renderApp()

    await user.click(screen.getByRole("button", { name: "Forgot PIN?" }))
    await user.click(await screen.findByRole("button", { name: "Sign out" }))

    expect(await screen.findByText(/Could not sign you out/)).toBeInTheDocument()
    expect(readPinRecord(userMe.id)).not.toBeNull()
    expect(assign).not.toHaveBeenCalled()
    expect(screen.getByRole("dialog", { name: "IHT is locked" })).toBeInTheDocument()

    server.use(http.post(apiUrl("/v1/oauth/logout"), () => HttpResponse.json(logoutResponse)))
    act(() => void window.dispatchEvent(new Event("online")))

    await waitFor(() => expect(assign).toHaveBeenCalled())
    expect(readPinRecord(userMe.id)).toBeNull()
  })
})
