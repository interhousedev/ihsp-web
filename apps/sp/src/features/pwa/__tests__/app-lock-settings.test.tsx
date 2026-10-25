/** "App lock" in Settings: set, change and turn off the PIN. */
import { beforeEach, describe, expect, test } from "bun:test"
import { dropdownLabels, selectDropdownValue, userMe } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { configureTests, setValue } from "../../../tests/helpers"
import { AppLockSection } from "../components/app-lock-section"
import { RELOCK_OPTIONS, type RelockOption } from "../utils/lock-policy"
import { createPinRecord, verifyPin } from "../utils/pin"
import { pinStorageKey, readPinRecord, writePinRecord } from "../utils/pin-storage"
import { renderPwa, setRuntimeConfig } from "./pwa-test-support"

configureTests()

beforeEach(() => setRuntimeConfig("pwa"))

function renderSection() {
  return renderPwa(<AppLockSection />)
}

async function fill(label: string, value: string) {
  setValue(await screen.findByLabelText(label), value)
}

describe("the portal", () => {
  test("has no app lock card", () => {
    setRuntimeConfig("sp")

    renderSection()

    expect(screen.queryByText("App lock")).not.toBeInTheDocument()
  })
})

describe("turning the lock on", () => {
  test("starts off, and offers to set a PIN", () => {
    renderSection()

    expect(screen.getByText("App lock is off.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Set a PIN" })).toBeInTheDocument()
  })

  test("saves only a salted hash of the PIN, for this user", async () => {
    const { user } = renderSection()
    await user.click(screen.getByRole("button", { name: "Set a PIN" }))

    await fill("New PIN (4 to 6 digits)", "482100")
    await fill("Repeat the new PIN", "482100")
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(screen.getByText("App lock is on.", { selector: "p" })).toBeInTheDocument())
    const record = readPinRecord(userMe.id)
    expect(record?.length).toBe(6)
    expect(await verifyPin(record as NonNullable<typeof record>, "482100")).toBe(true)
    expect(window.localStorage.getItem(pinStorageKey(userMe.id))).not.toContain("482100")
  })

  test("a PIN that is too short, or has letters, is refused", async () => {
    const { user } = renderSection()
    await user.click(screen.getByRole("button", { name: "Set a PIN" }))

    await fill("New PIN (4 to 6 digits)", "12a4")
    await fill("Repeat the new PIN", "12a4")
    await user.click(screen.getByRole("button", { name: "Save" }))

    expect(await screen.findByText("The PIN must be 4 to 6 digits.")).toBeInTheDocument()
    expect(readPinRecord(userMe.id)).toBeNull()
  })

  test("two different PINs are refused", async () => {
    const { user } = renderSection()
    await user.click(screen.getByRole("button", { name: "Set a PIN" }))

    await fill("New PIN (4 to 6 digits)", "1234")
    await fill("Repeat the new PIN", "1235")
    await user.click(screen.getByRole("button", { name: "Save" }))

    expect(await screen.findByText("The PINs do not match.")).toBeInTheDocument()
    expect(readPinRecord(userMe.id)).toBeNull()
  })

  test("Cancel closes the form without saving", async () => {
    const { user } = renderSection()
    await user.click(screen.getByRole("button", { name: "Set a PIN" }))

    await user.click(screen.getByRole("button", { name: "Cancel" }))

    expect(screen.getByRole("button", { name: "Set a PIN" })).toBeInTheDocument()
    expect(readPinRecord(userMe.id)).toBeNull()
  })
})

describe("with a PIN", () => {
  beforeEach(async () => {
    writePinRecord(userMe.id, await createPinRecord("1234", 1000))
  })

  test("is on, and offers Change PIN and Turn off", () => {
    renderSection()

    expect(screen.getByText("App lock is on.", { selector: "p" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Change PIN" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Turn off" })).toBeInTheDocument()
  })

  test("changing the PIN needs the current one", async () => {
    const { user } = renderSection()
    await user.click(screen.getByRole("button", { name: "Change PIN" }))
    await fill("Current PIN", "9999")
    await fill("New PIN (4 to 6 digits)", "5678")
    await fill("Repeat the new PIN", "5678")

    await user.click(screen.getByRole("button", { name: "Save" }))

    expect(await screen.findByText("Wrong PIN.")).toBeInTheDocument()
    const record = readPinRecord(userMe.id)
    expect(await verifyPin(record as NonNullable<typeof record>, "1234")).toBe(true)
  })

  test("with the current PIN the new one replaces it", async () => {
    const { user } = renderSection()
    await user.click(screen.getByRole("button", { name: "Change PIN" }))
    await fill("Current PIN", "1234")
    await fill("New PIN (4 to 6 digits)", "5678")
    await fill("Repeat the new PIN", "5678")

    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(async () => {
      const record = readPinRecord(userMe.id)
      expect(await verifyPin(record as NonNullable<typeof record>, "5678")).toBe(true)
    })
    const record = readPinRecord(userMe.id)
    expect(await verifyPin(record as NonNullable<typeof record>, "1234")).toBe(false)
  })

  test("turning the lock off needs the current PIN", async () => {
    const { user } = renderSection()
    await user.click(screen.getByRole("button", { name: "Turn off" }))
    await fill("Current PIN", "0000")

    await user.click(screen.getAllByRole("button", { name: "Turn off" })[0] as HTMLElement)

    expect(await screen.findByText("Wrong PIN.")).toBeInTheDocument()
    expect(readPinRecord(userMe.id)).not.toBeNull()

    await fill("Current PIN", "1234")
    await user.click(screen.getAllByRole("button", { name: "Turn off" })[0] as HTMLElement)

    await waitFor(() => expect(readPinRecord(userMe.id)).toBeNull())
    expect(screen.getByText("App lock is off.")).toBeInTheDocument()
  })
})

const OPTION_LABELS: Record<RelockOption, string> = {
  immediately: "Immediately",
  "1m": "After 1 minute",
  "5m": "After 5 minutes",
  "15m": "After 15 minutes",
  "1h": "After 1 hour",
  never: "Only when the app starts",
}

describe("Ask for the PIN again", () => {
  test("is not offered while the lock is off", () => {
    renderSection()

    expect(screen.queryByLabelText("Ask for the PIN again")).not.toBeInTheDocument()
  })

  test("a new PIN asks again after 5 minutes", async () => {
    const { user } = renderSection()
    await user.click(screen.getByRole("button", { name: "Set a PIN" }))
    await fill("New PIN (4 to 6 digits)", "1234")
    await fill("Repeat the new PIN", "1234")

    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(readPinRecord(userMe.id)?.relock).toBe("5m"))
    expect(await screen.findByLabelText("Ask for the PIN again")).toHaveAttribute("data-value", "5m")
  })

  test("offers every option, with its own words", async () => {
    writePinRecord(userMe.id, await createPinRecord("1234", 1000))
    const { user } = renderSection()

    const select = screen.getByLabelText("Ask for the PIN again")

    expect(await dropdownLabels(user, select)).toEqual(RELOCK_OPTIONS.map((option) => OPTION_LABELS[option]))
  })

  for (const option of RELOCK_OPTIONS) {
    test(`choosing "${OPTION_LABELS[option]}" is stored with the PIN of this user`, async () => {
      writePinRecord(userMe.id, await createPinRecord("1234", 1000, option === "1h" ? "never" : "1h"))
      writePinRecord("someone-else", await createPinRecord("9999", 1000, "never"))
      const { user } = renderSection()

      await selectDropdownValue(user, screen.getByLabelText("Ask for the PIN again"), option)

      await waitFor(() => expect(readPinRecord(userMe.id)?.relock).toBe(option))
      expect(readPinRecord("someone-else")?.relock).toBe("never")
      const record = readPinRecord(userMe.id)
      expect(await verifyPin(record as NonNullable<typeof record>, "1234")).toBe(true)
    })
  }

  test("changing the PIN keeps the chosen delay", async () => {
    writePinRecord(userMe.id, await createPinRecord("1234", 1000, "15m"))
    const { user } = renderSection()
    await user.click(screen.getByRole("button", { name: "Change PIN" }))
    await fill("Current PIN", "1234")
    await fill("New PIN (4 to 6 digits)", "5678")
    await fill("Repeat the new PIN", "5678")

    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(async () => {
      const record = readPinRecord(userMe.id)
      expect(await verifyPin(record as NonNullable<typeof record>, "5678")).toBe(true)
    })
    expect(readPinRecord(userMe.id)?.relock).toBe("15m")
  })
})
