/** The remembered user that lets the installed app start without the network. */
import { describe, expect, test } from "bun:test"
import { userMe } from "@ihsp/test-utils"
import {
  OFFLINE_SESSION_MAX_AGE_MS,
  clearOfflineSession,
  loadOfflineSession,
  parseOfflineSession,
  saveOfflineSession,
  serializeOfflineSession,
} from "../utils/offline-session"

describe("parseOfflineSession", () => {
  test("reads back what was saved", () => {
    expect(parseOfflineSession(serializeOfflineSession(userMe, 1000), 2000)).toEqual(userMe)
  })

  test("a week-old user is forgotten", () => {
    const raw = serializeOfflineSession(userMe, 0)

    expect(parseOfflineSession(raw, OFFLINE_SESSION_MAX_AGE_MS)).toEqual(userMe)
    expect(parseOfflineSession(raw, OFFLINE_SESSION_MAX_AGE_MS + 1)).toBeNull()
  })

  test("garbage and half-written values are not a user", () => {
    for (const raw of [
      null,
      "",
      "{nope",
      "[]",
      '{"savedAt":1}',
      '{"user":{"id":1},"savedAt":1}',
      '{"user":{},"savedAt":1}',
    ]) {
      expect(parseOfflineSession(raw, 2000)).toBeNull()
    }
  })

  test("a time in the future is not trusted", () => {
    expect(parseOfflineSession(serializeOfflineSession(userMe, 5000), 1000)).toBeNull()
  })
})

describe("the stored user", () => {
  test("is saved, loaded and cleared", () => {
    saveOfflineSession(userMe)
    expect(loadOfflineSession()?.id).toBe(userMe.id)

    clearOfflineSession()

    expect(loadOfflineSession()).toBeNull()
  })
})
