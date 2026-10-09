import { describe, expect, it } from "bun:test"
import { TEST_ENV } from "@ihsp/test-utils"
import { getConfig, readConfig, resetConfig } from "../index"

function setEnv(env: Record<string, unknown>) {
  window.__ENV__ = env
  resetConfig()
}

describe("APP_MODE", () => {
  it("is sp when the variable is absent (an env.js rendered before the app host existed)", () => {
    const { APP_MODE: _removed, ...rest } = TEST_ENV
    setEnv(rest)

    expect(getConfig().APP_MODE).toBe("sp")
  })

  it("is sp when the variable is empty (an unset variable rendered by envsubst)", () => {
    setEnv({ ...TEST_ENV, APP_MODE: "" })

    expect(getConfig().APP_MODE).toBe("sp")
  })

  it("accepts pwa together with the app OAuth client", () => {
    setEnv({ ...TEST_ENV, APP_MODE: "pwa", OAUTH_CLIENT_ID: "app" })

    expect(getConfig().APP_MODE).toBe("pwa")
    expect(getConfig().OAUTH_CLIENT_ID).toBe("app")
  })

  it("rejects an unknown mode and names the key", () => {
    setEnv({ ...TEST_ENV, APP_MODE: "kiosk" })

    const result = readConfig()

    expect(result.ok).toBe(false)
    expect(result.ok ? [] : result.missing).toEqual(["APP_MODE"])
  })
})

describe("APP_URL", () => {
  it("is optional and empty counts as absent", () => {
    setEnv({ ...TEST_ENV, APP_URL: "" })

    expect(getConfig().APP_URL).toBeUndefined()
  })

  it("is an origin without a trailing slash", () => {
    setEnv({ ...TEST_ENV, APP_URL: "https://app.ihsu.uz/" })

    expect(getConfig().APP_URL).toBe("https://app.ihsu.uz")
  })

  it("must be a URL when set", () => {
    setEnv({ ...TEST_ENV, APP_URL: "app.ihsu.uz" })

    expect(readConfig().ok).toBe(false)
  })
})
