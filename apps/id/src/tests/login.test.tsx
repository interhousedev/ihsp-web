/** UF-ID-02, UF-ID-03, ID-12, ID-13, ID-16: the Hydra login page. */
import { beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, loginResultRedirect, problem, server } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { http } from "msw"
import { LoginPage } from "../features/login/components/login-page"
import { clickButton, fillField, findHeading, findLink, renderId, allowSlowTests } from "./helpers"
import { redirectToMock } from "./redirect-mock"

allowSlowTests()

const ROUTE = "/login/?login_challenge=challenge-1"

async function submitCredentials(login: string, password: string): Promise<void> {
  await fillField("Login", login)
  await fillField("Password", password)
  await clickButton("Log in")
}

describe("login page", () => {
  beforeEach(() => redirectToMock.mockClear())

  test("a correct password follows redirect_to", async () => {
    renderId(<LoginPage />, { route: ROUTE })

    await submitCredentials("brastilov.aleksey", "Secret123")

    await waitFor(() => expect(redirectToMock).toHaveBeenCalledWith(loginResultRedirect.redirect_to))
  })

  test("a second factor result shows the code step and a correct code follows redirect_to", async () => {
    renderId(<LoginPage />, { route: ROUTE })

    await submitCredentials("second.factor", "Secret123")
    await findHeading("Enter the code")
    expect(screen.getByText("We sent a code to: Telegram, email.")).toBeInTheDocument()
    expect(redirectToMock).not.toHaveBeenCalled()
    await fillField("Code", "123456")
    await clickButton("Confirm")

    await waitFor(() => expect(redirectToMock).toHaveBeenCalledWith(loginResultRedirect.redirect_to))
  })

  test("Log in with OTP is always shown and keeps the challenge", async () => {
    renderId(<LoginPage />, { route: ROUTE })

    const link = await findLink("Log in with OTP")

    // next/link adds the trailing slash only with `trailingSlash: true`, which the unit test environment lacks.
    expect(link.getAttribute("href")).toMatch(/^\/login\/otp\/?\?login_challenge=challenge-1$/)
  })

  test("a wrong password shows a generic message and does not redirect", async () => {
    renderId(<LoginPage />, { route: ROUTE })

    await submitCredentials("brastilov.aleksey", "wrong-password")

    expect(await screen.findByText("Wrong login or password.")).toBeInTheDocument()
    expect(redirectToMock).not.toHaveBeenCalled()
  })

  test("a locked account shows the wait time", async () => {
    renderId(<LoginPage />, { route: ROUTE })

    await submitCredentials("locked.user", "Secret123")

    expect(await screen.findByText("Too many attempts. Try again in 5 min.")).toBeInTheDocument()
  })

  test("a missing role links back to the platform", async () => {
    renderId(<LoginPage />, { route: ROUTE })

    await submitCredentials("no.role", "Secret123")

    expect(await screen.findByText("You don't have access to this platform.")).toBeInTheDocument()
    expect((await findLink("Back to the app")).getAttribute("href")).toBe("http://localhost:3002")
  })

  test("an already authenticated browser (skip) is sent on without a form", async () => {
    renderId(<LoginPage />, { route: "/login/?login_challenge=skip" })

    await waitFor(() => expect(redirectToMock).toHaveBeenCalled())
    expect(screen.queryByLabelText("Password")).not.toBeInTheDocument()
  })

  test("a used challenge (410) follows its redirect_to", async () => {
    server.use(
      http.post(apiUrl("/v1/id/login"), () =>
        problem(410, "auth/challenge-used", "Challenge used", {
          params: { redirect_to: "http://localhost:3002/after" },
        }),
      ),
    )
    renderId(<LoginPage />, { route: ROUTE })

    await submitCredentials("brastilov.aleksey", "Secret123")

    await waitFor(() => expect(redirectToMock).toHaveBeenCalledWith("http://localhost:3002/after"))
  })

  test("without a challenge the page explains how to start", async () => {
    renderId(<LoginPage />, { route: "/login/" })

    expect(await findHeading("Open this page from an app")).toBeInTheDocument()
  })
})
