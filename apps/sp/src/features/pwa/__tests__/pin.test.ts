/** The app lock as pure functions: the PIN format, salted PBKDF2 hashing, verification and the five-try limit. */
import { describe, expect, test } from "bun:test"
import {
  PIN_ITERATIONS,
  PIN_MAX_ATTEMPTS,
  attemptsLeft,
  createPinRecord,
  isValidPin,
  parsePinRecord,
  registerRightPin,
  registerWrongPin,
  withRelock,
  verifyPin,
} from "../utils/pin"

/** Few rounds: these tests are about the logic, not the cost. */
const FAST = 1000

describe("isValidPin", () => {
  test("4 to 6 digits", () => {
    for (const pin of ["1234", "12345", "123456", "0000"]) expect(isValidPin(pin)).toBe(true)
  })

  test("nothing else", () => {
    for (const pin of ["", "123", "1234567", "12a4", "12 34", "１２３４", "-123", "12.4", " 1234"]) {
      expect(isValidPin(pin)).toBe(false)
    }
  })
})

describe("createPinRecord and verifyPin", () => {
  test("the right PIN opens, a wrong one does not", async () => {
    const record = await createPinRecord("4821", FAST)

    expect(await verifyPin(record, "4821")).toBe(true)
    expect(await verifyPin(record, "4822")).toBe(false)
    expect(await verifyPin(record, "482")).toBe(false)
    expect(await verifyPin(record, "")).toBe(false)
  })

  test("a PIN of 6 digits is not a PIN of 4 with something added", async () => {
    const record = await createPinRecord("482100", FAST)

    expect(await verifyPin(record, "4821")).toBe(false)
    expect(await verifyPin(record, "482100")).toBe(true)
  })

  test("the PIN itself is not in the record", async () => {
    const record = await createPinRecord("482100", FAST)

    expect(JSON.stringify(record)).not.toContain("482100")
    expect(Object.keys(record).toSorted()).toEqual([
      "failed",
      "hash",
      "iterations",
      "length",
      "relock",
      "salt",
      "version",
    ])
  })

  test("the same PIN gets a different salt and hash every time", async () => {
    const first = await createPinRecord("4821", FAST)
    const second = await createPinRecord("4821", FAST)

    expect(first.salt).not.toBe(second.salt)
    expect(first.hash).not.toBe(second.hash)
    expect(await verifyPin(first, "4821")).toBe(true)
    expect(await verifyPin(second, "4821")).toBe(true)
  })

  test("a record is checked with the rounds it was made with", async () => {
    const record = await createPinRecord("4821", FAST)

    expect(record.iterations).toBe(FAST)
    expect(await verifyPin({ ...record, iterations: FAST + 1 }, "4821")).toBe(false)
  })

  test("the default is a slow hash", async () => {
    expect(PIN_ITERATIONS).toBeGreaterThanOrEqual(100_000)
    const record = await createPinRecord("4821")

    expect(record.iterations).toBe(PIN_ITERATIONS)
    expect(record.length).toBe(4)
    expect(record.failed).toBe(0)
  })

  test("a new PIN asks again after 5 minutes unless told otherwise", async () => {
    expect((await createPinRecord("4821", FAST)).relock).toBe("5m")
    expect((await createPinRecord("4821", FAST, "never")).relock).toBe("never")
  })

  test("refuses to hash something that is not a PIN", async () => {
    await expect(createPinRecord("12", FAST)).rejects.toThrow(RangeError)
    await expect(createPinRecord("abcd", FAST)).rejects.toThrow(RangeError)
  })
})

describe("wrong tries", () => {
  test("each wrong try is counted and the tries left go down", async () => {
    let record = await createPinRecord("4821", FAST)

    for (const left of [4, 3, 2, 1]) {
      const result = registerWrongPin(record)
      expect(result.attemptsLeft).toBe(left)
      expect(result.lockedOut).toBe(false)
      record = result.record
    }
    expect(attemptsLeft(record)).toBe(1)
  })

  test("the fifth wrong try locks the user out", async () => {
    let record = await createPinRecord("4821", FAST)
    let result = registerWrongPin(record)
    for (let attempt = 2; attempt <= PIN_MAX_ATTEMPTS; attempt += 1) {
      record = result.record
      result = registerWrongPin(record)
    }

    expect(result.record.failed).toBe(PIN_MAX_ATTEMPTS)
    expect(result.attemptsLeft).toBe(0)
    expect(result.lockedOut).toBe(true)
  })

  test("a right try clears the count", async () => {
    const record = { ...(await createPinRecord("4821", FAST)), failed: 3 }

    expect(registerRightPin(record).failed).toBe(0)
    expect(registerRightPin(await createPinRecord("4821", FAST)).failed).toBe(0)
  })

  test("a record that used all its tries has none left", async () => {
    expect(attemptsLeft({ ...(await createPinRecord("4821", FAST)), failed: 9 })).toBe(0)
  })
})

describe("withRelock", () => {
  test("changes only the delay: the same PIN still opens it", async () => {
    const record = await createPinRecord("4821", FAST)

    const changed = withRelock(record, "never")

    expect(changed.relock).toBe("never")
    expect({ ...changed, relock: record.relock }).toEqual(record)
    expect(await verifyPin(changed, "4821")).toBe(true)
  })

  test("the same delay is the same record", async () => {
    const record = await createPinRecord("4821", FAST)

    expect(withRelock(record, "5m")).toBe(record)
  })
})

describe("parsePinRecord", () => {
  test("reads back a stored record", async () => {
    const record = await createPinRecord("4821", FAST)

    expect(parsePinRecord(JSON.stringify(record))).toEqual(record)
  })

  test("a record without the delay (written before it was a setting) keeps the default", async () => {
    const { relock: _removed, ...legacy } = await createPinRecord("4821", FAST)

    expect(parsePinRecord(JSON.stringify(legacy))?.relock).toBe("5m")
  })

  test("a delay that is not an option falls back to the default, a valid one is kept", async () => {
    const good = await createPinRecord("4821", FAST, "1h")

    expect(parsePinRecord(JSON.stringify(good))?.relock).toBe("1h")
    expect(parsePinRecord(JSON.stringify({ ...good, relock: "2m" }))?.relock).toBe("5m")
  })

  test("a missing or damaged record is no lock", async () => {
    const good = await createPinRecord("4821", FAST)
    const bad = [
      null,
      "",
      "{nope",
      "[]",
      JSON.stringify({ ...good, version: 2 }),
      JSON.stringify({ ...good, salt: 5 }),
      JSON.stringify({ ...good, iterations: 0 }),
      JSON.stringify({ ...good, length: 9 }),
      JSON.stringify({ ...good, failed: -1 }),
    ]

    for (const raw of bad) expect(parsePinRecord(raw)).toBeNull()
  })
})
