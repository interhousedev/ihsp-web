import { describe, expect, test } from "bun:test"
import { ApiError } from "@ihsp/api"
import { renderWithProviders, setWebQuota, webQuotaDisabled, webQuotaSpent } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { useWebQuota } from "./use-web-quota"
import { useWebSearchErrorMessage, webSearchFailure } from "./use-web-search-error"

function QuotaProbe() {
  const { enabled, remaining, spent } = useWebQuota()
  return <p>{`enabled=${enabled} remaining=${remaining} spent=${spent}`}</p>
}

function ErrorProbe({ error }: { error: unknown }) {
  const message = useWebSearchErrorMessage()
  return <p>{message(error) ?? "other"}</p>
}

const failure = (type: string, params: Record<string, unknown> = {}) =>
  new ApiError({ type, status: 429, title: "x", message_key: null, params })

describe("useWebQuota", () => {
  test("reads today's quota; the switch is off until it is loaded", async () => {
    renderWithProviders(<QuotaProbe />)
    expect(screen.getByText("enabled=false remaining=0 spent=false")).toBeTruthy()
    expect(await screen.findByText("enabled=true remaining=4 spent=false")).toBeTruthy()
  })

  test("is spent when no search is left", async () => {
    setWebQuota(webQuotaSpent)
    renderWithProviders(<QuotaProbe />)
    expect(await screen.findByText("enabled=true remaining=0 spent=true")).toBeTruthy()
  })

  test("stays off when the server turned web search off", async () => {
    setWebQuota(webQuotaDisabled)
    renderWithProviders(<QuotaProbe />)
    expect(await screen.findByText("enabled=false remaining=0 spent=false")).toBeTruthy()
  })
})

describe("web search failures", () => {
  test("recognises the three web search errors only", () => {
    expect(webSearchFailure(failure("web-search/disabled"))).toBe("disabled")
    expect(webSearchFailure(failure("web-search/quota-exceeded"))).toBe("quota-exceeded")
    expect(webSearchFailure(failure("web-search/unavailable"))).toBe("unavailable")
    expect(webSearchFailure(failure("ai/limit-reached"))).toBeNull()
    expect(webSearchFailure(new Error("boom"))).toBeNull()
  })

  test("quota-exceeded names the reset time, the others have their own text", () => {
    const quota = failure("web-search/quota-exceeded", { resets_at: "2026-10-08T00:00:00Z" })
    const { unmount } = renderWithProviders(<ErrorProbe error={quota} />)
    expect(screen.getByText(/No web searches left today\. Resets at/)).toBeTruthy()
    unmount()
    renderWithProviders(<ErrorProbe error={failure("web-search/unavailable")} />)
    expect(screen.getByText("Web search is not available right now.")).toBeTruthy()
  })

  test("another error gives null so the caller uses its own text", () => {
    renderWithProviders(<ErrorProbe error={failure("ai/limit-reached")} />)
    expect(screen.getByText("other")).toBeTruthy()
  })
})
