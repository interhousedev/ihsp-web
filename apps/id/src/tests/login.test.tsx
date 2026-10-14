/** UF-ID-02, UF-ID-03, ID-12, ID-13, ID-16: the Hydra login page. */
import { beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, loginResultRedirect, problem, server } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
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

  test("a password set by an administrator asks for a new one before the redirect", async () => {
    renderId(<LoginPage />, { route: ROUTE })

    await submitCredentials("must.change", "Temp-Pass-1")
    await findHeading("Choose a new password")
    expect(redirectToMock).not.toHaveBeenCalled()
    await fillField("New password", "Own-Secret-2")
    await fillField("Repeat the password", "Own-Secret-2")
    await clickButton("Save and continue")

    await waitFor(() => expect(redirectToMock).toHaveBeenCalledWith(loginResultRedirect.redirect_to))
  })

  test("the new password step refuses a mismatch without calling the server", async () => {
    renderId(<LoginPage />, { route: ROUTE })

    await submitCredentials("must.change", "Temp-Pass-1")
    await findHeading("Choose a new password")
    await fillField("New password", "Own-Secret-2")
    await fillField("Repeat the password", "Other-Secret-3")
    await clickButton("Save and continue")

    expect(await screen.findByText("The passwords do not match.")).toBeInTheDocument()
    expect(redirectToMock).not.toHaveBeenCalled()
  })

  test("an account scheduled for deletion offers Restore, which continues the login", async () => {
    let restoreBody: unknown = null
    server.use(
      http.post(apiUrl("/v1/id/login/restore"), async ({ request }) => {
        restoreBody = await request.json()
        return HttpResponse.json(loginResultRedirect)
      }),
    )
    renderId(<LoginPage />, { route: ROUTE })

    await submitCredentials("pending.deletion", "Secret123")
    await findHeading("Restore your account?")
    expect(screen.getByText(/Your account is scheduled for deletion on .*2026/)).toBeInTheDocument()
    expect(redirectToMock).not.toHaveBeenCalled()
    await clickButton("Restore")

    await waitFor(() => expect(redirectToMock).toHaveBeenCalledWith(loginResultRedirect.redirect_to))
    expect(restoreBody).toEqual({ login_challenge: "challenge-1", ticket: "restore-ticket-1" })
  })

  test("Keep deleted rejects the login instead of restoring", async () => {
    renderId(<LoginPage />, { route: ROUTE })

    await submitCredentials("pending.deletion", "Secret123")
    await findHeading("Restore your account?")
    await clickButton("Keep deleted / Sign out")

    await waitFor(() =>
      expect(redirectToMock).toHaveBeenCalledWith("http://localhost:4444/oauth2/auth?error=access_denied"),
    )
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

  test("the form is drawn at once when the address says which client asks, and the name comes from the server", async () => {
    let release: () => void = () => undefined
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    server.use(
      http.get(apiUrl("/v1/id/login"), async () => {
        await gate
        return HttpResponse.json({
          client_id: "staff",
          client_name: "IHT staff",
          skip: false,
          requires_second_factor: false,
          redirect_to: null,
        })
      }),
    )
    renderId(<LoginPage />, { route: `${ROUTE}&client_id=staff&client_name=Microsoft+365` })

    expect(await screen.findByLabelText("Password")).toBeInTheDocument()
    expect(screen.getByText("to continue")).toBeInTheDocument()
    expect(screen.queryByText(/Microsoft/)).not.toBeInTheDocument()
    release()
    expect(await screen.findByText("to continue to IHT staff")).toBeInTheDocument()
    expect(screen.queryByText(/Microsoft/)).not.toBeInTheDocument()
  })

  test("the login field is focused on a desktop and the recovery links sit behind one button", async () => {
    renderId(<LoginPage />, { route: ROUTE })

    const login = await screen.findByLabelText("Login")
    await waitFor(() => expect(login).toHaveFocus())
    expect(screen.queryByText("Forgot password?")).not.toBeInTheDocument()
    await clickButton("Can't get in?")
    expect(await findLink("Forgot password?")).toBeInTheDocument()
    expect(await findLink("Reclaim the account with EMIS")).toBeInTheDocument()
  })

  test("a failed login moves focus to the alert", async () => {
    server.use(
      http.post(apiUrl("/v1/id/login"), () => problem(401, "auth/invalid-credentials", "Wrong login or password")),
    )
    renderId(<LoginPage />, { route: ROUTE })

    await submitCredentials("brastilov.aleksey", "wrong")

    const alert = await screen.findByRole("alert")
    await waitFor(() => expect(alert).toHaveFocus())
  })

  test("a hinted form still logs in and follows redirect_to", async () => {
    renderId(<LoginPage />, { route: `${ROUTE}&client_id=sp&client_name=IHT+sp` })

    await submitCredentials("brastilov.aleksey", "Secret123")

    await waitFor(() => expect(redirectToMock).toHaveBeenCalledWith(loginResultRedirect.redirect_to))
  })

  test("without a challenge the page explains how to start", async () => {
    renderId(<LoginPage />, { route: "/login/" })

    expect(await findHeading("Open this page from an app")).toBeInTheDocument()
  })
})
