/** UF-ID-04-UF-ID-06, UF-ID-09, UF-ID-11, UF-ID-12, UF-ID-14, UF-ID-16: the security pages. */
import { beforeEach, describe, expect, test } from "bun:test"
import { adminMe, apiUrl, server, teacherMe, userMe } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { ActivityPage } from "../features/security/components/activity-page"
import { DeleteAccountPage } from "../features/security/components/delete-account-page"
import { EmailChangePage } from "../features/security/components/email-change-page"
import { OtpSettingsPage } from "../features/security/components/otp-settings-page"
import { PasswordChangePage } from "../features/security/components/password-change-page"
import { SecurityPage } from "../features/security/components/security-page"
import { SessionsPage } from "../features/security/components/sessions-page"
import { TelegramLinksPage } from "../features/security/components/telegram-links-page"
import { clickButton, fillField, findButton, findLink, LOGGED_IN, renderId, allowSlowTests } from "./helpers"
import { redirectToMock } from "./redirect-mock"

allowSlowTests()

const teacher = { access_token: "teacher-token", user: teacherMe }
const admin = { access_token: "admin-token", user: adminMe }

describe("security overview", () => {
  test("a student sees the EMIS and delete cards and every other card links to its page", async () => {
    renderId(<SecurityPage />, { route: "/security/", session: LOGGED_IN })

    expect(await findLink(/EMIS account/)).toBeInTheDocument()
    expect(await findLink(/Delete account/)).toBeInTheDocument()
    expect((await findLink(/Sessions/)).getAttribute("href")).toMatch(/^\/security\/sessions\/?$/)
    expect((await findLink(/Connectors/)).getAttribute("href")).toMatch(/^\/connectors\/?$/)
  })

  test("a teacher has no EMIS or delete card", async () => {
    renderId(<SecurityPage />, { route: "/security/", session: teacher })

    await findLink(/Recovery email/)

    expect(screen.queryByRole("link", { name: /EMIS account/, hidden: true })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /Delete account/, hidden: true })).not.toBeInTheDocument()
  })

  test("a rejected EMIS password shows the banner (ID-8)", async () => {
    server.use(http.get(apiUrl("/v1/id/me"), () => HttpResponse.json({ ...userMe, emis_status: "needs_reauth" })))
    renderId(<SecurityPage />, { route: "/security/", session: LOGGED_IN })

    expect(await screen.findByText("EMIS rejected the saved password")).toBeInTheDocument()
    expect((await findLink("Update EMIS password")).getAttribute("href")).toMatch(/^\/security\/emis\/?$/)
  })
})

describe("sessions", () => {
  test("marks the current session and revokes another one", async () => {
    let revoked = null as string | null
    server.use(
      http.delete(apiUrl("/v1/id/me/sessions/:id"), ({ params }) => {
        revoked = String(params.id)
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderId(<SessionsPage />, { route: "/security/sessions/", session: LOGGED_IN })

    expect(await screen.findByText("This device")).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: "Log out", hidden: true })).toHaveLength(1)
    await clickButton("Log out")

    await waitFor(() => expect(revoked).toBe("00000007-0000-4000-8000-000000000002"))
  })

  test("Log out everywhere else asks first", async () => {
    let called = false
    server.use(
      http.post(apiUrl("/v1/id/me/sessions/revoke-others"), () => {
        called = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderId(<SessionsPage />, { route: "/security/sessions/", session: LOGGED_IN })
    await screen.findByText("This device")

    await user.click(await findButton("Log out everywhere else"))
    expect(await screen.findByText("Log out everywhere else?")).toBeInTheDocument()
    expect(called).toBe(false)
    await user.click(
      (await screen.findAllByRole("button", { name: "Log out everywhere else", hidden: true })).at(-1) as HTMLElement,
    )

    await waitFor(() => expect(called).toBe(true))
  })
})

describe("Telegram accounts", () => {
  test("Link Telegram opens the bot and linked accounts can switch OTP delivery off", async () => {
    let patch = null as { otp_delivery: boolean } | null
    server.use(
      http.patch(apiUrl("/v1/id/me/telegram/:id"), async ({ request }) => {
        patch = (await request.json()) as { otp_delivery: boolean }
        return HttpResponse.json({ ...userMe.telegram[0], otp_delivery: false })
      }),
    )
    const { user } = renderId(<TelegramLinksPage />, { route: "/security/telegram/", session: LOGGED_IN })

    const link = await findLink("Open the bot")
    expect(link.getAttribute("href")).toBe("https://t.me/ihspbot")
    expect(link.getAttribute("target")).toBe("_blank")
    expect(await screen.findByText("@aleksey_b")).toBeInTheDocument()
    await user.click(screen.getByRole("switch", { hidden: true }))

    await waitFor(() => expect(patch).toEqual({ otp_delivery: false }))
  })

  test("unlinking the last OTP channel warns before confirming", async () => {
    server.use(http.get(apiUrl("/v1/id/me"), () => HttpResponse.json({ ...userMe, otp_enabled: true })))
    const { user } = renderId(<TelegramLinksPage />, { route: "/security/telegram/", session: LOGGED_IN })
    await screen.findByText("@aleksey_b")

    await user.click(await findButton("Unlink"))

    expect(await screen.findByText(/Last OTP channel\./)).toBeInTheDocument()
  })
})

describe("OTP login", () => {
  beforeEach(() => redirectToMock.mockClear())

  test("enables OTP with a test code", async () => {
    renderId(<OtpSettingsPage />, { route: "/security/otp/", session: LOGGED_IN })

    await clickButton("Send test code")
    await screen.findByText("Enter the test code")
    await fillField("Code", "123456")
    await clickButton("Turn on OTP login")

    expect(await screen.findByText(/OTP login is on/)).toBeInTheDocument()
  })

  test("OTP is optional for Administration: the password form to turn it off is shown", async () => {
    server.use(http.get(apiUrl("/v1/id/me"), () => HttpResponse.json({ ...adminMe, otp_enabled: true })))
    renderId(<OtpSettingsPage />, {
      route: "/security/otp/",
      session: { ...admin, user: { ...adminMe, otp_enabled: true } },
    })

    expect(await screen.findByLabelText("Current password")).toBeInTheDocument()
  })

  test("turning OTP off asks for the password", async () => {
    let body = null as { password: string } | null
    server.use(
      http.get(apiUrl("/v1/id/me"), () => HttpResponse.json({ ...userMe, otp_enabled: true })),
      http.post(apiUrl("/v1/id/me/otp/disable"), async ({ request }) => {
        body = (await request.json()) as { password: string }
        return HttpResponse.json({ ...userMe, otp_enabled: false })
      }),
    )
    renderId(<OtpSettingsPage />, { route: "/security/otp/", session: LOGGED_IN })

    await fillField("Current password", "Secret123")
    await clickButton("Turn off OTP login")

    await waitFor(() => expect(body).toEqual({ password: "Secret123" }))
    expect(await screen.findByText("Turn on OTP login")).toBeInTheDocument()
  })
})

describe("recovery email and password", () => {
  test("the email change needs the password, then a code sent to the new address", async () => {
    let request = null as { password: string; new_email: string } | null
    server.use(
      http.post(apiUrl("/v1/id/me/email/change"), async ({ request: incoming }) => {
        request = (await incoming.json()) as { password: string; new_email: string }
        return new HttpResponse(null, { status: 202 })
      }),
    )
    renderId(<EmailChangePage />, { route: "/security/email/", session: LOGGED_IN })

    await fillField("Current password", "Secret123")
    await fillField("New email", "new-address@example.org")
    await clickButton("Send code")
    await screen.findByText("We sent a 6-digit code to new-address@example.org.")
    await fillField("Code", "123456")
    await clickButton("Confirm the change")

    expect(await screen.findByText("The recovery email was changed. The old address got a notice.")).toBeInTheDocument()
    expect(request).toEqual({ password: "Secret123", new_email: "new-address@example.org" })
  })

  test("the new password must follow the rules and match", async () => {
    renderId(<PasswordChangePage />, { route: "/security/password/", session: LOGGED_IN })

    await fillField("Current password", "Secret123")
    await fillField("New password", "weak")
    await fillField("Repeat the password", "other")
    await clickButton("Change the password")

    expect(await screen.findByText("The password does not meet the rules.")).toBeInTheDocument()
    expect(screen.getByText("The passwords do not match.")).toBeInTheDocument()
  })

  test("a valid new password is sent and confirmed", async () => {
    let body = null as { current_password: string; new_password: string } | null
    server.use(
      http.post(apiUrl("/v1/id/me/password"), async ({ request }) => {
        body = (await request.json()) as { current_password: string; new_password: string }
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderId(<PasswordChangePage />, { route: "/security/password/", session: LOGGED_IN })

    await fillField("Current password", "Secret123")
    await fillField("New password", "Better456")
    await fillField("Repeat the password", "Better456")
    await clickButton("Change the password")

    expect(await screen.findByText("The password was changed. Other devices were logged out.")).toBeInTheDocument()
    expect(body).toEqual({ current_password: "Secret123", new_password: "Better456" })
  })
})

describe("activity and account deletion", () => {
  test("lists security events with readable names and offers the fixes", async () => {
    renderId(<ActivityPage />, { route: "/security/activity/", session: LOGGED_IN })

    expect(await screen.findByText("Logged in")).toBeInTheDocument()
    expect(screen.getByText("Password changed")).toBeInTheDocument()
    expect(screen.getByText("Account blocked by Administration")).toBeInTheDocument()
    expect(await findLink("Change password")).toBeInTheDocument()
  })

  test("deleting needs the password and a final confirmation, then shows when data is removed", async () => {
    let body = null as { password: string } | null
    server.use(
      http.delete(apiUrl("/v1/id/me"), async ({ request }) => {
        body = (await request.json()) as { password: string }
        return HttpResponse.json({ closes_on: "2026-11-06" }, { status: 202 })
      }),
    )
    const { user } = renderId(<DeleteAccountPage />, { route: "/security/delete/", session: LOGGED_IN })

    expect(await screen.findByText("Attendance records, with your name")).toBeInTheDocument()
    const submit = await findButton("Delete my account")
    expect(submit).toBeDisabled()
    await fillField("Current password", "Secret123")
    await user.click(await findButton("Delete my account"))
    await screen.findByText("Delete your account?")
    expect(body).toBeNull()
    await user.click(
      (await screen.findAllByRole("button", { name: "Delete my account", hidden: true })).at(-1) as HTMLElement,
    )

    expect(await screen.findByText("Account closed")).toBeInTheDocument()
    expect(body).toEqual({ password: "Secret123" })
  })
})
