/** IHT ID login: an all-digit (EMIS-style) login without an IHT ID goes to EMIS registration; the button sits on top. */
import { beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, loginResultRedirect, problem, server } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { LoginPage } from "../features/login/components/login-page"
import { RegisterPage } from "../features/registration/components/register-page"
import { clickButton, fillField, findLink, renderId, allowSlowTests } from "./helpers"
import { redirectToMock } from "./redirect-mock"

allowSlowTests()

const ROUTE = "/login/?login_challenge=challenge-1"

async function submitCredentials(login: string, password: string): Promise<void> {
  await fillField("Login", login)
  await fillField("Password", password)
  await clickButton("Log in")
}

/** The registration URL that the login page redirected to, parsed so the test checks its parts. */
function redirectedRegisterUrl(): URL {
  const call = redirectToMock.mock.calls.at(-1)
  expect(call).toBeDefined()
  return new URL(String(call?.[0]), "https://id.example")
}

describe("login with an EMIS-style (all-digit) login", () => {
  beforeEach(() => redirectToMock.mockClear())

  test("invalid credentials for a digits-only login go to EMIS registration with the login and the challenge", async () => {
    server.use(
      http.post(apiUrl("/v1/id/login"), () => problem(401, "auth/invalid-credentials", "Wrong login or password")),
    )
    renderId(<LoginPage />, { route: ROUTE })

    await submitCredentials("20230115", "emis-secret")

    await waitFor(() => expect(redirectToMock).toHaveBeenCalledTimes(1))
    const url = redirectedRegisterUrl()
    expect(url.pathname).toBe("/register/")
    expect(url.searchParams.get("login_challenge")).toBe("challenge-1")
    expect(url.searchParams.get("emis_login")).toBe("20230115")
    expect(url.searchParams.has("password")).toBe(false)
    expect(url.href).not.toContain("emis-secret")
  })

  test("the registration page prefills the EMIS login, shows the notice and keeps the challenge", async () => {
    renderId(<RegisterPage />, { route: "/register/?login_challenge=challenge-1&emis_login=20230115" })

    expect(await screen.findByText("This looks like an EMIS login — let's create your IHT ID.")).toBeInTheDocument()
    expect(screen.getByLabelText("EMIS login")).toHaveValue("20230115")
    expect(screen.getByLabelText("EMIS password")).toHaveValue("")
    expect(await findLink("I already have an account")).toHaveAttribute(
      "href",
      expect.stringContaining("login_challenge=challenge-1"),
    )
  })

  test("a digits-only login that signs in is not redirected to registration", async () => {
    server.use(
      http.post(apiUrl("/v1/id/login"), () =>
        HttpResponse.json({ redirect_to: loginResultRedirect.redirect_to, second_factor: null }),
      ),
    )
    renderId(<LoginPage />, { route: ROUTE })

    await submitCredentials("20230115", "emis-secret")

    await waitFor(() => expect(redirectToMock).toHaveBeenCalledWith(loginResultRedirect.redirect_to))
    expect(redirectToMock).toHaveBeenCalledTimes(1)
  })

  test("a wrong password for a normal login stays on the login page", async () => {
    server.use(
      http.post(apiUrl("/v1/id/login"), () => problem(401, "auth/invalid-credentials", "Wrong login or password")),
    )
    renderId(<LoginPage />, { route: ROUTE })

    await submitCredentials("brastilov.aleksey", "wrong-password")

    expect(await screen.findByText("Wrong login or password.")).toBeInTheDocument()
    expect(redirectToMock).not.toHaveBeenCalled()
  })
})

describe("login card layout", () => {
  test("Register with EMIS is a full-width outline button above the login form, with an or sign in divider", async () => {
    renderId(<LoginPage />, { route: ROUTE })

    const register = await findLink("Register with EMIS")
    expect(register.className).toContain("w-full")
    expect(register.className).toContain("border-primary")
    expect(screen.getByText("or sign in")).toBeInTheDocument()

    const login = await screen.findByLabelText("Login")
    // DOCUMENT_POSITION_FOLLOWING (4): the login field comes after the button in the page order.
    expect(register.compareDocumentPosition(login) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
