/** The messages between the page and the service worker. */
import { describe, expect, test } from "bun:test"
import { SW_EVENT, SW_MESSAGE, parseSwEvent, parseSwMessage } from "../utils/sw-messages"

describe("parseSwMessage", () => {
  test("a user message carries the user id", () => {
    expect(parseSwMessage({ type: SW_MESSAGE.setUser, userId: "u-1" })).toEqual({
      type: SW_MESSAGE.setUser,
      userId: "u-1",
    })
    expect(parseSwMessage({ type: SW_MESSAGE.setUser })).toBeNull()
    expect(parseSwMessage({ type: SW_MESSAGE.setUser, userId: "" })).toBeNull()
  })

  test("the commands need nothing else", () => {
    for (const type of [SW_MESSAGE.clearUser, SW_MESSAGE.skipWaiting, SW_MESSAGE.purgeShell]) {
      expect(parseSwMessage({ type, extra: 1 })).toEqual({ type })
    }
  })

  test("other scripts' messages are ignored", () => {
    for (const data of [null, "hello", 5, {}, { type: "workbox:skip" }]) expect(parseSwMessage(data)).toBeNull()
  })
})

describe("parseSwEvent", () => {
  test("an updated answer names its URL", () => {
    expect(parseSwEvent({ type: SW_EVENT.apiUpdated, url: "https://api/x" })).toEqual({
      type: SW_EVENT.apiUpdated,
      url: "https://api/x",
    })
    expect(parseSwEvent({ type: SW_EVENT.apiUpdated })).toBeNull()
    expect(parseSwEvent(null)).toBeNull()
  })
})
