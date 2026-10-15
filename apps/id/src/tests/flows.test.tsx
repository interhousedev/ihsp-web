/** UF-ID-07, UF-ID-08, UF-ID-10, UF-ID-13, UF-ID-15: activation, recovery, reclaim and logout pages. */
import { beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { ActivatePage } from "../features/activation/components/activate-page"
import { LogoutPage } from "../features/logout/components/logout-page"
import { ReclaimPage } from "../features/reclaim/components/reclaim-page"
import { LoginRecoveryPage } from "../features/recovery/components/login-recovery-page"
import { OtpRecoveryPage } from "../features/recovery/components/otp-recovery-page"
import { PasswordRecoveryPage } from "../features/recovery/components/password-recovery-page"
import { LOGIN_TICKET_KEY } from "../features/shared/utils/login-ticket"
import { clickButton, fillField, findHeading, findLink, renderId, allowSlowTests } from "./helpers"
import { redirectToMock } from "./redirect-mock"

allowSlowTests()

beforeEach(() => redirectToMock.mockClear())

describe("staff activation", () => {
  test("an expired or used link asks for a new one", async () => {
    renderId(<ActivatePage />, { route: "/activate/?token=expired" })

    expect(await findHeading("This link no longer works")).toBeInTheDocument()
  })

  test("sets the password and email, confirms the code and follows redirect_to", async () => {
    let body = null as { password: string; email: string; email_code: string } | null
    server.use(
      http.post(apiUrl("/v1/id/activation/:token"), async ({ request }) => {
        body = (await request.json()) as { password: string; email: string; email_code: string }
        return HttpResponse.json({ redirect_to: "http://localhost:3004/" })
      }),
    )
    renderId(<ActivatePage />, { route: "/activate/?token=valid-token" })

    await findHeading("Welcome, Gavxar Kalandarova")
    await fillField("New password", "Secret123")
    await fillField("Repeat the password", "Secret123")
    await fillField("Recovery email", "teacher@example.org")
    await clickButton("Send code to the email")
    await findHeading("Confirm your email")
    await fillField("Code", "123456")
    await clickButton("Activate the account")

    await waitFor(() => expect(redirectToMock).toHaveBeenCalledWith("http://localhost:3004/"))
    expect(body).toEqual({ password: "Secret123", email: "teacher@example.org", email_code: "123456" })
  })

  test("without a token the link is treated as invalid", async () => {
    renderId(<ActivatePage />, { route: "/activate/" })

    expect(await findHeading("This link no longer works")).toBeInTheDocument()
  })
})

describe("recovery", () => {
  test("password reset: login, code and a new password, then this device ends signed in", async () => {
    let body = null as { login_or_email: string; code: string; new_password: string } | null
    server.use(
      http.post(apiUrl("/v1/id/recovery/password/confirm"), async ({ request }) => {
        body = (await request.json()) as { login_or_email: string; code: string; new_password: string }
        return HttpResponse.json({ login_ticket: "reset-ticket" })
      }),
    )
    renderId(<PasswordRecoveryPage />, { route: "/recovery/password/" })

    await fillField("Login or email", "brastilov.aleksey")
    await clickButton("Send code")
    await findHeading("Set a new password")
    expect(screen.getByText("If the account exists, we sent a code to its recovery email.")).toBeInTheDocument()
    await fillField("Code", "123456")
    await fillField("New password", "Better456")
    await fillField("Repeat the password", "Better456")
    await clickButton("Change the password")

    await findHeading("Password changed")
    expect(body).toEqual({ login_or_email: "brastilov.aleksey", code: "123456", new_password: "Better456" })
    expect(screen.getByText("You stay signed in on this device.")).toBeInTheDocument()
    await clickButton("Continue")
    expect(window.sessionStorage.getItem(LOGIN_TICKET_KEY)).toBe("reset-ticket")
    expect(redirectToMock).toHaveBeenCalledWith("/")
    window.sessionStorage.removeItem(LOGIN_TICKET_KEY)
  })

  test("OTP reset shows when it takes effect", async () => {
    renderId(<OtpRecoveryPage />, { route: "/recovery/otp/" })

    await fillField("Login", "brastilov.aleksey")
    await clickButton("Send code")
    await findHeading("Confirm the reset")
    await fillField("Code", "123456")
    await clickButton("Reset OTP")

    await findHeading("OTP reset scheduled")
    // 2026-10-08T05:12:00Z is 10:12 in Asia/Tashkent.
    expect(screen.getByText(/OTP is reset on 8 Oct 2026(,| at) 10:12/)).toBeInTheDocument()
  })

  test("forgot login shows one neutral message", async () => {
    renderId(<LoginRecoveryPage />, { route: "/recovery/login/" })

    await fillField("Recovery email", "someone@example.org")
    await clickButton("Send login")

    expect(await screen.findByText("If this email belongs to an account, we sent the login to it.")).toBeInTheDocument()
  })
})

describe("reclaim", () => {
  test("EMIS credentials, a new password and email, then the code", async () => {
    let body = null as { reclaim_token: string; new_password: string; email_code: string } | null
    server.use(
      http.post(apiUrl("/v1/id/reclaim/complete"), async ({ request }) => {
        body = (await request.json()) as { reclaim_token: string; new_password: string; email_code: string }
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderId(<ReclaimPage />, { route: "/reclaim/" })

    await fillField("EMIS login", "student01")
    await fillField("EMIS password", "emis-secret")
    await clickButton("Continue")
    await findHeading("Set a new password")
    await fillField("New password", "Better456")
    await fillField("Repeat the password", "Better456")
    await fillField("Recovery email", "new@example.org")
    await clickButton("Send code to the email")
    await findHeading("Confirm your email")
    await fillField("Code", "123456")
    await clickButton("Reclaim the account")

    await findHeading("Account recovered")
    expect(body?.new_password).toBe("Better456")
    expect(body?.email_code).toBe("123456")
    expect(await findLink("Log in")).toBeInTheDocument()
  })

  test("an Administration account cannot be reclaimed", async () => {
    server.use(
      http.post(apiUrl("/v1/id/reclaim/emis"), () =>
        HttpResponse.json(
          { type: "id/admin-reset-forbidden", title: "Forbidden", status: 403 },
          { status: 403, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    )
    renderId(<ReclaimPage />, { route: "/reclaim/" })

    await fillField("EMIS login", "student01")
    await fillField("EMIS password", "emis-secret")
    await clickButton("Continue")

    expect(await screen.findByText(/Contact Administration/)).toBeInTheDocument()
  })
})

describe("logout page", () => {
  test("accepts the challenge and follows redirect_to", async () => {
    renderId(<LogoutPage />, { route: "/logout/?logout_challenge=out-1" })

    await waitFor(() => expect(redirectToMock).toHaveBeenCalledWith("http://localhost:3001/"))
  })

  test("a used logout challenge follows its redirect_to", async () => {
    server.use(
      http.get(apiUrl("/v1/id/logout"), () =>
        HttpResponse.json(
          {
            type: "auth/challenge-used",
            title: "Used",
            status: 410,
            params: { redirect_to: "http://localhost:3002/" },
          },
          { status: 410, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    )
    renderId(<LogoutPage />, { route: "/logout/?logout_challenge=out-2" })

    await waitFor(() => expect(redirectToMock).toHaveBeenCalledWith("http://localhost:3002/"))
  })
})
