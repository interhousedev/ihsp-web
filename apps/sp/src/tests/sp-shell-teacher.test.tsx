/** SP-UX-a5: a signed-in user without the student role gets a way out, not a dead end. */
import { describe, expect, test } from "bun:test"
import { teacherMe } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { SpShell } from "../features/shell/components/sp-shell"
import { configureTests, renderSp } from "./helpers"

configureTests()

describe("teacher in the student app", () => {
  test("SP-UX-a5: sees the explanation with staff and ID links and a sign-out button", async () => {
    renderSp(<SpShell>content</SpShell>, { session: { user: teacherMe } })

    expect(await screen.findByRole("link", { name: /staff/i })).toHaveAttribute("href", "http://localhost:3003")
    expect(screen.getByRole("link", { name: /\bID\b/ })).toHaveAttribute("href", "http://localhost:3001")
    expect(screen.getByRole("button", { name: /sign out|log out/i })).toBeInTheDocument()
    expect(screen.queryByText("content")).not.toBeInTheDocument()
  })
})
