import { describe, expect, it } from "bun:test"
import { renderWithProviders } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { LinkButton, isInternalHref } from "./link-button"
import { PageLoading } from "./page-loading"
import { QueryState } from "./query-state"

describe("isInternalHref", () => {
  it("accepts same-app paths and refuses protocol-relative and backslash ones", () => {
    expect(isInternalHref("/settings/")).toBe(true)
    expect(isInternalHref("//evil.example/")).toBe(false)
    expect(isInternalHref("/\\evil.example/")).toBe(false)
    expect(isInternalHref("https://lms.ihsp.uz/")).toBe(false)
  })
})

describe("LinkButton", () => {
  it("renders a button-styled link with the phone touch target", () => {
    renderWithProviders(<LinkButton href="/settings/">Settings</LinkButton>)
    const link = screen.getByRole("link", { name: "Settings" })
    expect(link.getAttribute("href")).toMatch(/^\/settings\/?$/)
    expect(link.className).toContain("min-h-11")
  })
})

describe("QueryState", () => {
  const base = { isPending: false, isError: false, error: null, refetch: () => undefined }
  it("renders the data, the empty state and the error state", () => {
    const { unmount } = renderWithProviders(
      <QueryState query={{ ...base, data: ["a"] }}>{(rows) => <p>{rows.join(",")}</p>}</QueryState>,
    )
    expect(screen.getByText("a")).toBeInTheDocument()
    unmount()

    const empty = renderWithProviders(
      <QueryState query={{ ...base, data: [] as string[] }} isEmpty={(rows) => rows.length === 0} emptyText="Nothing">
        {() => <p>never</p>}
      </QueryState>,
    )
    expect(screen.getByText("Nothing")).toBeInTheDocument()
    empty.unmount()

    renderWithProviders(
      <QueryState query={{ ...base, data: undefined, isError: true, error: new Error("boom") }}>
        {() => <p>never</p>}
      </QueryState>,
    )
    expect(screen.queryByText("never")).not.toBeInTheDocument()
    expect(screen.getByRole("button")).toBeInTheDocument()
  })

  it("PageLoading shows the loading state", () => {
    renderWithProviders(<PageLoading />)
    expect(screen.getByRole("status")).toBeInTheDocument()
  })
})
