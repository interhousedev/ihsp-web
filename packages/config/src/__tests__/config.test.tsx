import { describe, expect, it } from "bun:test"
import { render, screen } from "@testing-library/react"
import { TEST_ENV } from "@ihsp/test-utils"
import { ConfigGate, getConfig, readConfig, resetConfig } from "../index"

function setEnv(env: Record<string, unknown>) {
  window.__ENV__ = env
  resetConfig()
}

describe("getConfig", () => {
  it("returns the validated runtime config", () => {
    expect(getConfig().API_URL).toBe("http://localhost:8000")
    expect(getConfig().OAUTH_CLIENT_ID).toBe("sp")
  })

  it("drops a trailing slash from origins so paths can be appended", () => {
    setEnv({ ...TEST_ENV, API_URL: "https://api.ihsu.uz/" })

    expect(getConfig().API_URL).toBe("https://api.ihsu.uz")
  })

  it("treats an empty SENTRY_DSN (unset variable) as absent", () => {
    setEnv({ ...TEST_ENV, SENTRY_DSN: "" })

    expect(getConfig().SENTRY_DSN).toBeUndefined()
  })

  it("throws a message that names the missing key", () => {
    const { API_URL: _removed, ...rest } = TEST_ENV
    setEnv(rest)

    expect(() => getConfig()).toThrow(/API_URL/)
  })

  it("reports a missing window.__ENV__ (env.js not loaded)", () => {
    window.__ENV__ = undefined
    resetConfig()

    const result = readConfig()

    expect(result.ok).toBe(false)
    expect(result.ok ? [] : result.missing).toEqual(["window.__ENV__"])
  })
})

describe("ConfigGate", () => {
  it("renders the children when the config is valid", () => {
    render(
      <ConfigGate>
        <p>app</p>
      </ConfigGate>,
    )

    expect(screen.getByText("app")).toBeInTheDocument()
  })

  it("shows an error screen listing the missing API_URL instead of the app", () => {
    const { API_URL: _removed, ...rest } = TEST_ENV
    setEnv(rest)

    render(
      <ConfigGate>
        <p>app</p>
      </ConfigGate>,
    )

    const alert = screen.getByRole("alert")
    expect(alert).toHaveTextContent("API_URL")
    expect(screen.queryByText("app")).not.toBeInTheDocument()
  })

  it("lists every invalid key, not only the first", () => {
    setEnv({ ...TEST_ENV, API_URL: "not a url", OAUTH_CLIENT_ID: "nope" })

    render(<ConfigGate>app</ConfigGate>)

    expect(screen.getByRole("list")).toHaveTextContent("API_URL")
    expect(screen.getByRole("list")).toHaveTextContent("OAUTH_CLIENT_ID")
  })
})

describe("BootSplash", () => {
  it("is what the static HTML of an app contains, so the first paint is a spinner and not a blank page", async () => {
    const { renderToString } = await import("react-dom/server")

    const html = renderToString(
      <ConfigGate>
        <p>app</p>
      </ConfigGate>,
    )

    expect(html).toContain("data-boot-splash")
    expect(html).toContain('role="status"')
    expect(html).not.toContain("app</p>")
  })
})
