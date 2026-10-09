/** When the app asks for the PIN: on launch, and again after the delay the user chose. */
import { describe, expect, test } from "bun:test"
import {
  DEFAULT_RELOCK,
  RELOCK_DELAY_MS,
  RELOCK_OPTIONS,
  isLockedAtLaunch,
  isRelockOption,
  readActiveMarker,
  shouldLockOnReturn,
  writeActiveMarker,
  type RelockOption,
} from "../utils/lock-policy"
import { PIN_STORAGE_PREFIX, clearPinRecord, pinStorageKey, readPinRecord, writePinRecord } from "../utils/pin-storage"
import { createPinRecord } from "../utils/pin"

const MINUTE = 60 * 1000
const DELAYS: [RelockOption, number][] = [
  ["immediately", 0],
  ["1m", MINUTE],
  ["5m", 5 * MINUTE],
  ["15m", 15 * MINUTE],
  ["1h", 60 * MINUTE],
]

describe("the options", () => {
  test("are: immediately, 1, 5 and 15 minutes, 1 hour, and never (only when the app starts)", () => {
    expect([...RELOCK_OPTIONS]).toEqual(["immediately", "1m", "5m", "15m", "1h", "never"])
  })

  test("each has its delay in milliseconds, and never has none", () => {
    for (const [option, delay] of DELAYS) expect(RELOCK_DELAY_MS[option]).toBe(delay)
    expect(RELOCK_DELAY_MS.never).toBeNull()
  })

  test("a new PIN asks again after 5 minutes", () => {
    expect(DEFAULT_RELOCK).toBe("5m")
  })

  test("only the options are options", () => {
    for (const option of RELOCK_OPTIONS) expect(isRelockOption(option)).toBe(true)
    for (const other of ["", "2m", "NEVER", null, 5, undefined]) expect(isRelockOption(other)).toBe(false)
  })
})

describe("isLockedAtLaunch", () => {
  test("without a PIN there is nothing to lock, whatever the option", () => {
    for (const option of RELOCK_OPTIONS) expect(isLockedAtLaunch(false, null, 1000, option)).toBe(false)
  })

  test("a new launch (no marker in this session) is locked with every option, even never", () => {
    for (const option of RELOCK_OPTIONS) expect(isLockedAtLaunch(true, null, 1000, option)).toBe(true)
  })

  for (const [option, delay] of DELAYS) {
    test(`a reload is locked again once ${option} has passed since the app was active, not before`, () => {
      expect(isLockedAtLaunch(true, 1000, 1000 + delay, option)).toBe(true)
      if (delay > 0) expect(isLockedAtLaunch(true, 1000, 1000 + delay - 1, option)).toBe(false)
    })
  }

  test("with never, a reload of a running app stays unlocked however long ago it was active", () => {
    expect(isLockedAtLaunch(true, 1000, 1000 + 1000 * 60 * MINUTE, "never")).toBe(false)
  })

  test("a marker from the future is not trusted", () => {
    for (const option of RELOCK_OPTIONS) expect(isLockedAtLaunch(true, 9000, 1000, option)).toBe(true)
  })
})

describe("shouldLockOnReturn", () => {
  for (const [option, delay] of DELAYS) {
    test(`${option}: locks when the app was away for ${delay} ms, not for less`, () => {
      expect(shouldLockOnReturn(true, 1000, 1000 + delay, option)).toBe(true)
      if (delay > 0) expect(shouldLockOnReturn(true, 1000, 1000 + delay - 1, option)).toBe(false)
    })
  }

  test("immediately locks even a glance at another app", () => {
    expect(shouldLockOnReturn(true, 1000, 1000, "immediately")).toBe(true)
  })

  test("never does not lock on return, however long the app was away", () => {
    expect(shouldLockOnReturn(true, 0, 1000 * 60 * MINUTE, "never")).toBe(false)
  })

  test("no PIN, or never left: nothing to lock", () => {
    for (const option of RELOCK_OPTIONS) {
      expect(shouldLockOnReturn(false, 0, 100 * MINUTE, option)).toBe(false)
      expect(shouldLockOnReturn(true, null, 100 * MINUTE, option)).toBe(false)
    }
  })
})

describe("the active marker", () => {
  test("is kept in the session", () => {
    expect(readActiveMarker()).toBeNull()

    writeActiveMarker(1234)

    expect(readActiveMarker()).toBe(1234)
  })
})

describe("the stored PIN", () => {
  test("is one record per user", async () => {
    const mine = await createPinRecord("4821", 1000)
    const theirs = await createPinRecord("9999", 1000)

    expect(writePinRecord("u1", mine)).toBe(true)
    expect(writePinRecord("u2", theirs)).toBe(true)

    expect(readPinRecord("u1")).toEqual(mine)
    expect(readPinRecord("u2")).toEqual(theirs)
    expect(window.localStorage.getItem(pinStorageKey("u1"))).not.toContain("4821")
    expect(pinStorageKey("u1").startsWith(PIN_STORAGE_PREFIX)).toBe(true)
  })

  test("is removed for one user only", async () => {
    writePinRecord("u1", await createPinRecord("4821", 1000))
    writePinRecord("u2", await createPinRecord("9999", 1000))

    clearPinRecord("u1")

    expect(readPinRecord("u1")).toBeNull()
    expect(readPinRecord("u2")).not.toBeNull()
  })

  test("nobody known, no record", () => {
    expect(readPinRecord(null)).toBeNull()
    clearPinRecord(null)
  })
})
