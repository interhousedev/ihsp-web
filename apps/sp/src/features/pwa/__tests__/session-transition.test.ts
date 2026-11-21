/** When the worker learns the user and when everything stored is dropped. */
import { describe, expect, test } from "bun:test"
import { sessionTransition, type SessionView } from "../utils/session-transition"

const loading: SessionView = { status: "loading", userId: null, offline: false }
const signedIn = (userId: string, offline = false): SessionView => ({ status: "authenticated", userId, offline })
const anonymous: SessionView = { status: "anonymous", userId: null, offline: false }

describe("sessionTransition", () => {
  test("a session that starts tells the worker who is signed in", () => {
    expect(sessionTransition(loading, signedIn("u1"))).toBe("set-user")
  })

  test("another user signing in does too", () => {
    expect(sessionTransition(signedIn("u1"), signedIn("u2"))).toBe("set-user")
  })

  test("a token refresh of the same user changes nothing", () => {
    expect(sessionTransition(signedIn("u1"), signedIn("u1"))).toBeNull()
  })

  test("a session restored without the network (placeholder token) does not touch the worker", () => {
    expect(sessionTransition(loading, signedIn("u1", true))).toBeNull()
  })

  test("a session that ends clears everything stored", () => {
    expect(sessionTransition(signedIn("u1"), anonymous)).toBe("clear")
    expect(sessionTransition(loading, anonymous)).toBe("clear")
  })

  test("staying anonymous or loading changes nothing", () => {
    expect(sessionTransition(anonymous, anonymous)).toBeNull()
    expect(sessionTransition(loading, loading)).toBeNull()
  })
})
