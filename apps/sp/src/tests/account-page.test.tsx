/** The iht.id account inside the sp shell: security, connectors, personal tokens and appearance. */
import { describe, expect, test } from "bun:test"
import { screen } from "@testing-library/react"
import { AccountPage } from "../features/profile/components/account-page"
import { configureTests, renderSp } from "./helpers"

configureTests()

describe("account page", () => {
  test("renders the id sections and personal tokens from the id API", async () => {
    renderSp(<AccountPage />, { route: "/profile/account/" })

    expect(await screen.findByText("Grades script")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Personal tokens" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Connectors" })).toBeInTheDocument()
    expect(screen.getAllByRole("link").some((link) => link.getAttribute("href")?.endsWith("/security/password/"))).toBe(
      true,
    )
  })
})
