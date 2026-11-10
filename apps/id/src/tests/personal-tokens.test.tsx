/** Personal access tokens: list, create (secret shown once, OTP step-up) and revoke. */
import { describe, expect, test } from "bun:test"
import { personalTokenSecret } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { PersonalTokensPage } from "@ihsp/features-core/id-account"
import { allowSlowTests, clickButton, fillField, findButton, LOGGED_IN, renderId } from "./helpers"

allowSlowTests()

const render = () => renderId(<PersonalTokensPage />, { route: "/personal-tokens/", session: LOGGED_IN })

describe("personal tokens page", () => {
  test("lists tokens with expires and last used, never a secret", async () => {
    render()

    expect(await screen.findByText("Grades script")).toBeInTheDocument()
    expect(screen.getByText("Last used")).toBeInTheDocument()
    expect(screen.getByText("Expires")).toBeInTheDocument()
    expect(screen.getByText("me:read")).toBeInTheDocument()
    expect(screen.queryByText(personalTokenSecret)).not.toBeInTheDocument()
  })

  test("creating shows the secret once and it is gone after Done", async () => {
    render()

    await clickButton("New token")
    await fillField("Name", "CI script")
    await clickButton("Create token")
    expect(await screen.findByText("Enter the 6-digit code.")).toBeInTheDocument()
    await fillField("Code", "123456")
    await clickButton("Create token")

    const secret = await screen.findByTestId("personal-token-secret")
    expect(secret.textContent).toBe(personalTokenSecret)
    expect(screen.getByText("Copy it now")).toBeInTheDocument()

    await clickButton("Done")

    expect(screen.queryByTestId("personal-token-secret")).not.toBeInTheDocument()
    expect(await screen.findByText("CI script")).toBeInTheDocument()
    expect(screen.queryByText(personalTokenSecret)).not.toBeInTheDocument()
  })

  test("revoking asks to confirm and removes the token", async () => {
    const { user } = render()

    await user.click(await findButton("Revoke"))
    expect(await screen.findByText("Revoke Grades script?")).toBeInTheDocument()
    await user.click((await screen.findAllByRole("button", { name: "Revoke", hidden: true })).at(-1) as HTMLElement)

    expect(await screen.findByText("No personal tokens yet.")).toBeInTheDocument()
    expect(screen.queryByText("Grades script")).not.toBeInTheDocument()
  })
})
