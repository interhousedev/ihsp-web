/** UF-ID-01, ID-1-ID-5: EMIS registration in three steps. */
import { beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { RegisterPage } from "../features/registration/components/register-page"
import { clickButton, fillField, findHeading, findLink, renderId, allowSlowTests } from "./helpers"
import { redirectToMock } from "./redirect-mock"

allowSlowTests()

type CompleteBody = {
  registration_token: string
  password: string
  email_code: string
  confirm_import_match?: boolean
  login_challenge?: string
}

async function submitEmis(login: string, password = "emis-secret"): Promise<void> {
  await fillField("EMIS login", login)
  await fillField("EMIS password", password)
  await clickButton("Continue")
}

describe("registration", () => {
  beforeEach(() => redirectToMock.mockClear())

  test("walks the three steps, asks 'Is this you?' for an import and sends the confirmation", async () => {
    let body = null as CompleteBody | null
    server.use(
      http.post(apiUrl("/v1/id/register/complete"), async ({ request }) => {
        body = (await request.json()) as CompleteBody
        return HttpResponse.json({ login: "brastilov.aleksey", redirect_to: null })
      }),
    )
    const { user } = renderId(<RegisterPage />, { route: "/register/" })

    await submitEmis("imported")
    await findHeading("Is this you?")
    expect(screen.getByText("brastilov.aleksey")).toBeInTheDocument()
    await fillField("New password", "Secret123")
    await fillField("Repeat the password", "Secret123")
    await fillField("Recovery email", "aleksey@example.org")
    await clickButton("Send code to the email")
    expect(await screen.findByText("Please confirm to continue.")).toBeInTheDocument()
    await user.click(screen.getByText("Yes, this is me"))
    await clickButton("Send code to the email")
    await findHeading("Confirm your email")
    expect(screen.getByText("We sent a 6-digit code to aleksey@example.org.")).toBeInTheDocument()
    await fillField("Code", "123456")
    await clickButton("Create account")

    await findHeading("Welcome to IHT ID")
    await clickButton("Continue")
    await findHeading("Account created")
    expect(body).toEqual({
      registration_token: "registration-token-2",
      password: "Secret123",
      email_code: "123456",
      confirm_import_match: true,
    })
  })

  test("the password rules tick off while typing", async () => {
    renderId(<RegisterPage />, { route: "/register/" })
    await submitEmis("student01")
    await findHeading("Is this you?")
    expect(document.querySelectorAll('[data-met="true"]')).toHaveLength(0)

    await fillField("New password", "abcdefgh")

    await waitFor(() => expect(document.querySelectorAll('[data-met="true"]')).toHaveLength(2))
    await fillField("New password", "Abcdefg1")
    await waitFor(() => expect(document.querySelectorAll('[data-met="true"]')).toHaveLength(4))
  })

  test("a login challenge is sent with the completion and its redirect_to is followed", async () => {
    server.use(
      http.post(apiUrl("/v1/id/register/complete"), async ({ request }) => {
        const body = (await request.json()) as CompleteBody
        return HttpResponse.json({
          login: "brastilov.aleksey",
          redirect_to:
            body.login_challenge === "challenge-9" ? "http://localhost:4444/oauth2/auth?login_verifier=r" : null,
        })
      }),
    )
    renderId(<RegisterPage />, { route: "/register/?login_challenge=challenge-9" })
    await submitEmis("student01")
    await findHeading("Is this you?")
    await fillField("New password", "Secret123")
    await fillField("Repeat the password", "Secret123")
    await fillField("Recovery email", "aleksey@example.org")
    await clickButton("Send code to the email")
    await findHeading("Confirm your email")
    await fillField("Code", "123456")
    await clickButton("Create account")

    await findHeading("Welcome to IHT ID")
    expect(redirectToMock).not.toHaveBeenCalled()
    await clickButton("Continue")
    await waitFor(() =>
      expect(redirectToMock).toHaveBeenCalledWith("http://localhost:4444/oauth2/auth?login_verifier=r"),
    )
  })

  test("an EMIS account that is already linked offers login, reset and reclaim", async () => {
    renderId(<RegisterPage />, { route: "/register/" })

    await submitEmis("linked")

    expect(await screen.findByText("This EMIS account already has an IHT account.")).toBeInTheDocument()
    expect(await findLink("Reset the password")).toBeInTheDocument()
    expect(await findLink("Reclaim the account with EMIS")).toBeInTheDocument()
    expect(await findLink("Log in")).toBeInTheDocument()
  })

  test("wrong credentials, another institution and EMIS being down show their own messages", async () => {
    renderId(<RegisterPage />, { route: "/register/" })

    await submitEmis("student01", "bad-password")
    expect(await screen.findByText("Wrong EMIS login or password.")).toBeInTheDocument()
    await submitEmis("wrong-institution")
    expect(await screen.findByText(/belongs to another institution/)).toBeInTheDocument()
    await submitEmis("emis-down")
    expect(await screen.findByText("EMIS is not responding. Try again later.")).toBeInTheDocument()
  })
})
