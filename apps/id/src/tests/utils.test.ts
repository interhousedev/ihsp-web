/** Pure helpers: password rules (ID-4), error mapping, device text, connector snippet, redirects. */
import { describe, expect, test } from "bun:test"
import { ApiError, errorMessageKey } from "@ihsp/api"
import { connectorConfigSnippet, humanizeKey, mcpServerUrl } from "../features/connectors/utils/connector-config"
import { describeDevice } from "../features/shared/utils/describe-device"
import { challengeUsedTarget, withChallenge } from "../features/shared/utils/challenge"
import { idErrorKey, idErrorValues } from "../features/shared/utils/error-key"
import { checkPassword, isPasswordValid } from "../features/shared/utils/password-rules"
import { isEmail } from "../features/shared/utils/is-email"
import { toolsForScope } from "../features/consent/utils/scope-tools"
import { scopeCatalog } from "@ihsp/test-utils"

function apiError(type: string, params: Record<string, unknown> = {}): ApiError {
  return new ApiError({ type, status: 400, title: type, params })
}

describe("password rules", () => {
  test("need 8 characters, a digit, an uppercase and a lowercase letter", () => {
    expect(checkPassword("abc")).toEqual({ length: false, digit: false, upper: false, lower: true })
    expect(isPasswordValid("Abcdefg1")).toBe(true)
    expect(isPasswordValid("abcdefg1")).toBe(false)
    expect(isPasswordValid("ABCDEFG1")).toBe(false)
    expect(isPasswordValid("Abcdefgh")).toBe(false)
    expect(isPasswordValid("Ab1")).toBe(false)
  })

  test("count Cyrillic letters as letters", () => {
    expect(isPasswordValid("Пароль123")).toBe(true)
  })
})

const has = (key: string) =>
  key === "idErrors.auth.locked" || key === "errors.files.too-large" || key === "idErrors.auth.otp-invalid"

describe("error mapping", () => {
  test("prefers the id app message, then the shared one, then the generic one", () => {
    expect(idErrorKey(apiError("auth/locked"), has)).toBe("idErrors.auth.locked")
    expect(idErrorKey(apiError("files/too-large"), has)).toBe("errors.files.too-large")
    expect(idErrorKey(apiError("something/unknown"), has)).toBe("idErrors.generic")
    expect(idErrorKey(new Error("boom"), has)).toBe("idErrors.generic")
  })

  test("a wrong code without attempts left uses the plain message", () => {
    expect(idErrorKey(apiError("auth/otp-invalid"), has)).toBe("idErrors.auth.otp-invalid-plain")
    expect(idErrorKey(apiError("auth/otp-invalid", { attempts_left: 2 }), has)).toBe("idErrors.auth.otp-invalid")
    expect(errorMessageKey(apiError("auth/locked"))).toBe("errors.auth.locked")
  })

  test("a network failure has its own message and retry_after becomes minutes", () => {
    expect(idErrorKey(new ApiError({ type: "network/unreachable", status: 0, title: "x" }), has)).toBe(
      "idErrors.network",
    )
    expect(idErrorValues(apiError("auth/locked", { retry_after: 300 }))).toEqual({
      minutes: 5,
      seconds: 300,
      attempts: 0,
    })
    expect(idErrorValues(apiError("auth/locked", { retry_after: 20 })).minutes).toBe(1)
  })
})

describe("challenge helpers", () => {
  test("a used challenge exposes its redirect_to", () => {
    expect(challengeUsedTarget(apiError("auth/challenge-used", { redirect_to: "http://x/y" }))).toBe("http://x/y")
    expect(challengeUsedTarget(apiError("auth/challenge-used"))).toBeNull()
    expect(challengeUsedTarget(apiError("auth/locked", { redirect_to: "http://x/y" }))).toBeNull()
  })

  test("withChallenge adds the encoded challenge only when there is one", () => {
    expect(withChallenge("/login/", "login_challenge", "a b")).toBe("/login/?login_challenge=a%20b")
    expect(withChallenge("/login/", "login_challenge", null)).toBe("/login/")
  })
})

describe("small helpers", () => {
  test("describeDevice recognises common browsers and systems", () => {
    expect(describeDevice("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0 Safari/537.36")).toEqual({
      browser: "Chrome",
      os: "Windows",
    })
    expect(describeDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Telegram")).toEqual({
      browser: "Telegram",
      os: "iOS",
    })
    expect(describeDevice(null)).toEqual({ browser: null, os: null })
  })

  test("the connector config snippet has the server URL and the bearer header", () => {
    expect(mcpServerUrl("https://mcp.ihsu.uz/", "lms")).toBe("https://mcp.ihsu.uz/lms")
    expect(JSON.parse(connectorConfigSnippet("https://mcp.ihsu.uz", "student", "ihsp_mcp_abc"))).toEqual({
      url: "https://mcp.ihsu.uz/student",
      headers: { Authorization: "Bearer ihsp_mcp_abc" },
    })
    expect(humanizeKey("study_planner")).toBe("Study planner")
  })

  test("scope tools come from the catalog of the consent's server", () => {
    expect(toolsForScope(scopeCatalog, "student", "marks:read")).toEqual(["get_marks", "get_results"])
    expect(toolsForScope(scopeCatalog, "lms", "marks:read")).toEqual([])
    expect(toolsForScope(undefined, null, "x")).toEqual([])
  })

  test("isEmail accepts addresses and rejects text", () => {
    expect(isEmail(" a@b.org ")).toBe(true)
    expect(isEmail("not-an-email")).toBe(false)
  })
})
