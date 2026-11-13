/** Personal access tokens: list, create (secret shown once, OTP step-up) and revoke. */
import { describe, expect, test } from "bun:test"
import { apiUrl, clientConfig, personalTokenSecret, problem, server } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
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

describe("personal tokens documentation link", () => {
  test("links to the configured page in a new tab", async () => {
    const { user } = render()

    const link = await screen.findAllByRole("link", { name: "How personal tokens work" })
    expect(link[0]).toHaveAttribute("href", "https://docs.iht.test/personal-tokens")
    expect(link[0]).toHaveAttribute("target", "_blank")
    expect(link[0]).toHaveAttribute("rel", "noreferrer")
    await user.click(await findButton("New token"))
    expect(await screen.findAllByRole("link", { name: "How personal tokens work" })).not.toHaveLength(0)
  })

  test("is hidden when the docs URL is not configured", async () => {
    server.use(
      http.get(apiUrl("/v1/public/client-config"), () =>
        HttpResponse.json({ ...clientConfig, docs: { ...clientConfig.docs, personal_tokens_url: null } }),
      ),
    )
    render()

    await screen.findByText("Grades script")
    expect(screen.queryByRole("link", { name: "How personal tokens work" })).toBeNull()
  })
})

describe("step-up sender", () => {
  test("shows the translated message when the code cannot be delivered", async () => {
    server.use(
      http.post(apiUrl("/v1/id/me/step-up"), () => problem(503, "id/otp-delivery-failed", "Could not send the code")),
    )
    render()

    await clickButton("New token")
    await clickButton("Send code")
    expect(await screen.findByText("Could not send the code. Try again in a minute.")).toBeInTheDocument()
  })
})
