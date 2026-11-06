import { describe, expect, it, mock } from "bun:test"
import { renderWithProviders } from "@ihsp/test-utils"
import { fireEvent, screen } from "@testing-library/react"
import { CardSkeletons } from "./card-skeletons"
import { PageLoading } from "./page-loading"
import { QueryState } from "./query-state"

const base = { isPending: false, isError: false, error: null, refetch: () => {} }

describe("QueryState", () => {
  it("shows the given skeleton while the query is pending", () => {
    renderWithProviders(
      <QueryState query={{ ...base, data: undefined, isPending: true }} skeleton={<div data-testid="shape" />}>
        {() => null}
      </QueryState>,
    )
    expect(screen.getByTestId("shape")).toBeInTheDocument()
  })

  it("shows the filtered state with a reset when filters hide every row", () => {
    const onReset = mock(() => {})
    renderWithProviders(
      <QueryState query={{ ...base, data: [] }} isEmpty={(rows) => rows.length === 0} isFiltered onReset={onReset}>
        {() => null}
      </QueryState>,
    )
    fireEvent.click(screen.getByRole("button"))
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it("keeps the plain empty state and its text when no filter is active", () => {
    renderWithProviders(
      <QueryState query={{ ...base, data: [] }} isEmpty={(rows) => rows.length === 0} emptyText="No rows">
        {() => null}
      </QueryState>,
    )
    expect(screen.getByText("No rows")).toBeInTheDocument()
    expect(screen.queryByRole("button")).toBeNull()
  })
})

describe("PageLoading", () => {
  it("starts the page flush under the shell controls", () => {
    const { container } = renderWithProviders(<PageLoading />)
    expect(container.querySelector("[data-shell-flush]")).not.toBeNull()
  })
})

describe("CardSkeletons", () => {
  it("renders the requested number of cards, hidden from assistive tech", () => {
    const { container } = renderWithProviders(<CardSkeletons count={2} />)
    expect(container.querySelectorAll("li").length).toBe(2)
    expect(container.querySelector("ul")).toHaveAttribute("aria-hidden", "true")
  })
})
