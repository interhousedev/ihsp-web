import { describe, expect, it, mock } from "bun:test"
import { renderWithProviders } from "@ihsp/test-utils"
import { fireEvent, screen } from "@testing-library/react"
import { PageHeader } from "../components/layout/page-header"
import { ErrorPage, NotFoundPage } from "../components/page-states"
import { StateView } from "../components/state-view"

describe("StateView filtered", () => {
  it("offers a reset that calls back", () => {
    const onReset = mock(() => {})
    renderWithProviders(<StateView state="filtered" onReset={onReset} />)
    fireEvent.click(screen.getByRole("button"))
    expect(onReset).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("status")).toBeInTheDocument()
  })

  it("has no reset button without a handler", () => {
    renderWithProviders(<StateView state="filtered" />)
    expect(screen.queryByRole("button")).toBeNull()
  })
})

describe("StateView slots", () => {
  it("shows the given skeleton instead of the rows while loading", () => {
    const { container } = renderWithProviders(<StateView state="loading" skeleton={<div data-testid="shape" />} />)
    expect(screen.getByTestId("shape")).toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true")
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBe(0)
  })

  it("takes a title, a description, an action and a role", () => {
    renderWithProviders(
      <StateView
        state="empty"
        title="Locked"
        description="Ask a teacher"
        action={<button type="button">Go</button>}
        role="alert"
      />,
    )
    expect(screen.getByRole("alert")).toHaveTextContent("Locked")
    expect(screen.getByText("Ask a teacher")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Go" })).toBeInTheDocument()
  })
})

describe("NotFoundPage", () => {
  it("links to the given start page", () => {
    renderWithProviders(<NotFoundPage homeHref="/security/" />)
    expect(screen.getByRole("link")).toHaveAttribute("href", "/security/")
    expect(screen.getByRole("main")).toBeInTheDocument()
  })
})

describe("ErrorPage", () => {
  it("retries and shows nothing technical", () => {
    const onRetry = mock(() => {})
    const { container } = renderWithProviders(<ErrorPage onRetry={onRetry} />)
    fireEvent.click(screen.getByRole("button"))
    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("alert")).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/digest|stack|TypeError/i)
  })
})

describe("PageHeader", () => {
  it("shows the meta line and the badge next to the title", () => {
    renderWithProviders(<PageHeader title="Group" meta="EMIS 12" badge={<span>Active</span>} />)
    expect(screen.getByRole("heading", { level: 1, name: "Group" })).toBeInTheDocument()
    expect(screen.getByText("EMIS 12")).toBeInTheDocument()
    expect(screen.getByText("Active")).toBeInTheDocument()
  })
})
