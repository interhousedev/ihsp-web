/** IHT ID login: an all-digit identifier is an EMIS login, sent as emis_id and resolved by the server (ID-EMIS-LOGIN). */
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
const EMIS_LOGIN = "20230115"
const NOT_REGISTERED_OR_WRONG = "Wrong login or password."

async function submitCredentials(login: string, password: string): Promise<void> {
  await fillField("Login or EMIS login", login)
  await fillField("Password", password)
  await clickButton("Log in")
}

/** The login request bodies the page sent, in order. */
function recordLoginBodies(bodies: Array<Record<string, unknown>>, answer: () => Response) {
  return http.post(apiUrl("/v1/id/login"), async ({ request }) => {
    bodies.push((await request.json()) as Record<string, unknown>)
    return answer()
  })
}

describe("login with an EMIS login (all digits)", () => {
  beforeEach(() => redirectToMock.mockClear())

  test("an all-digit login is sent as emis_id, never as a login, and signs in", async () => {
    const bodies: Array<Record<string, unknown>> = []
    server.use(
      recordLoginBodies(bodies, () =>
        HttpResponse.json({ redirect_to: loginResultRedirect.redirect_to, second_factor: null }),
      ),
    )
    renderId(<LoginPage />, { route: ROUTE })

    await submitCredentials(EMIS_LOGIN, "emis-secret")

    await waitFor(() => expect(redirectToMock).toHaveBeenCalledWith(loginResultRedirect.redirect_to))
    expect(bodies).toHaveLength(1)
    expect(bodies[0]?.emis_id).toBe(EMIS_LOGIN)
    expect(bodies[0]).not.toHaveProperty("login")
  })

  test("an unregistered EMIS login gets the same generic error as a wrong password", async () => {
    server.use(recordLoginBodies([], () => problem(401, "auth/invalid-credentials", "Wrong login or password")))
    renderId(<LoginPage />, { route: ROUTE })

    await submitCredentials(EMIS_LOGIN, "emis-secret")

    expect(await screen.findByText(NOT_REGISTERED_OR_WRONG)).toBeInTheDocument()
    expect(redirectToMock).not.toHaveBeenCalled()
  })

  test("a throttled EMIS login shows the retry time", async () => {
    server.use(
      recordLoginBodies([], () =>
        problem(429, "common/rate-limited", "Too many attempts", { params: { retry_after: 60 } }),
      ),
    )
    renderId(<LoginPage />, { route: ROUTE })

    await submitCredentials(EMIS_LOGIN, "emis-secret")

    expect(await screen.findByText("Too many attempts. Try again in 1 min.")).toBeInTheDocument()
    expect(redirectToMock).not.toHaveBeenCalled()
  })

  test("a wrong password for a registered EMIS login stays on the login page", async () => {
    server.use(recordLoginBodies([], () => problem(401, "auth/invalid-credentials", "Wrong login or password")))
    renderId(<LoginPage />, { route: ROUTE })

    await submitCredentials(EMIS_LOGIN, "wrong-password")

    expect(await screen.findByText(NOT_REGISTERED_OR_WRONG)).toBeInTheDocument()
    expect(redirectToMock).not.toHaveBeenCalled()
  })

  test("an email or IHT login is sent as login and never as emis_id", async () => {
    const bodies: Array<Record<string, unknown>> = []
    server.use(recordLoginBodies(bodies, () => problem(401, "auth/invalid-credentials", "Wrong login or password")))
    renderId(<LoginPage />, { route: ROUTE })

    await submitCredentials("aleksey@example.org", "wrong-password")

    expect(await screen.findByText(NOT_REGISTERED_OR_WRONG)).toBeInTheDocument()
    expect(bodies[0]?.login).toBe("aleksey@example.org")
    expect(bodies[0]).not.toHaveProperty("emis_id")
  })
})

describe("EMIS registration entry", () => {
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
})

describe("login card layout", () => {
  test("Register with EMIS is a full-width outline button above the login form, with an or sign in divider", async () => {
    renderId(<LoginPage />, { route: ROUTE })

    const register = await findLink("Register with EMIS")
    expect(register.className).toContain("w-full")
    expect(register.className).toContain("border-primary")
    expect(screen.getByText("or sign in")).toBeInTheDocument()

    const login = await screen.findByLabelText("Login or EMIS login")
    // DOCUMENT_POSITION_FOLLOWING (4): the login field comes after the button in the page order.
    expect(register.compareDocumentPosition(login) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
