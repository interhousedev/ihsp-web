/** UF-ID-03, ID-13, ID-14: passwordless OTP login. */
import { beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, loginResultRedirect, server } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { OtpLoginPage } from "../features/otp-login/components/otp-login-page"
import { clickButton, fillField, findHeading, findLink, renderId, allowSlowTests } from "./helpers"
import { redirectToMock } from "./redirect-mock"

allowSlowTests()

const ROUTE = "/login/otp/?login_challenge=challenge-1"

describe("OTP login page", () => {
  beforeEach(() => redirectToMock.mockClear())

  test("asks for the login, then shows the same neutral message and the code step", async () => {
    renderId(<OtpLoginPage />, { route: ROUTE })

    await fillField("Login", "anyone.at.all")
    await clickButton("Send code")

    await findHeading("Enter the code")
    expect(screen.getByText("If OTP login is enabled for this login, we sent a code.")).toBeInTheDocument()
  })

  test("a correct code follows redirect_to", async () => {
    renderId(<OtpLoginPage />, { route: ROUTE })
    await fillField("Login", "brastilov.aleksey")
    await clickButton("Send code")
    await findHeading("Enter the code")

    await fillField("Code", "123456")
    await clickButton("Log in")

    await waitFor(() => expect(redirectToMock).toHaveBeenCalledWith(loginResultRedirect.redirect_to))
  })

  test("a wrong code shows the attempts left and a lost-access link is offered", async () => {
    server.use(
      http.post(apiUrl("/v1/id/login/otp"), () =>
        HttpResponse.json(
          { type: "auth/otp-invalid", title: "Invalid code", status: 401, params: { attempts_left: 2 } },
          { status: 401, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    )
    renderId(<OtpLoginPage />, { route: ROUTE })
    expect(await findLink("Lost access to Telegram?")).toBeInTheDocument()
    await fillField("Login", "brastilov.aleksey")
    await clickButton("Send code")
    await findHeading("Enter the code")

    await fillField("Code", "000000")
    await clickButton("Log in")

    expect(await screen.findByText("Wrong code. Attempts left: 2.")).toBeInTheDocument()
    expect(redirectToMock).not.toHaveBeenCalled()
  })

  test("a new code can only be requested after the cooldown", async () => {
    renderId(<OtpLoginPage />, { route: ROUTE })
    await fillField("Login", "brastilov.aleksey")
    await clickButton("Send code")
    await findHeading("Enter the code")

    const resend = await screen.findByRole("button", { name: /Send a new code in \d+ s/, hidden: true })

    expect(resend).toBeDisabled()
  })
})
