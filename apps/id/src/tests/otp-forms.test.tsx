/** UF-ID-06: the OTP enable and disable forms on their own. */
import { describe, expect, mock, test } from "bun:test"
import { apiUrl, server, userMe } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { OtpDisableForm } from "../features/security/components/otp-disable-form"
import { OtpEnableForm } from "../features/security/components/otp-enable-form"
import { clickButton, fillField, renderId, allowSlowTests } from "./helpers"
import { problem } from "./problem"

allowSlowTests()

const enabledUser = { ...userMe, otp_enabled: true }

describe("OtpEnableForm", () => {
  test("sends the chosen channels, then confirms the code and reports the user", async () => {
    let start = null as { via_email: boolean } | null
    let confirmBody = null as { code: string } | null
    server.use(
      http.post(apiUrl("/v1/id/me/otp/enable"), async ({ request }) => {
        start = (await request.json()) as { via_email: boolean }
        return new HttpResponse(null, { status: 202 })
      }),
      http.post(apiUrl("/v1/id/me/otp/enable/confirm"), async ({ request }) => {
        confirmBody = (await request.json()) as { code: string }
        return HttpResponse.json(enabledUser)
      }),
    )
    const onEnabled = mock(() => undefined)
    renderId(<OtpEnableForm user={userMe} onEnabled={onEnabled} />)

    fireEvent.click(await screen.findByLabelText("Recovery email"))
    await clickButton("Send test code")
    expect(await screen.findByText("Enter the test code")).toBeInTheDocument()
    expect(start).toEqual({ via_email: true })

    await fillField("Code", "123456")
    await clickButton("Turn on OTP login")

    await waitFor(() => expect(onEnabled).toHaveBeenCalledTimes(1))
    expect(confirmBody).toEqual({ code: "123456" })
    expect((onEnabled.mock.calls[0] as unknown[])[0]).toEqual(enabledUser)
  })

  test("without any channel the test code cannot be sent", async () => {
    const noChannels = { ...userMe, recovery_email: null, telegram: [] }
    renderId(<OtpEnableForm user={noChannels} onEnabled={() => undefined} />)

    expect(await screen.findByText(/Choose at least one channel/)).toBeInTheDocument()
    expect(await screen.findByRole("button", { name: "Send test code", hidden: true })).toBeDisabled()
  })

  test("a rejected test-code request shows the error and stays on the channel step", async () => {
    server.use(
      http.post(apiUrl("/v1/id/me/otp/enable"), () => problem(429, "common/rate-limited", { retry_after: 120 })),
    )
    renderId(<OtpEnableForm user={userMe} onEnabled={() => undefined} />)

    await clickButton("Send test code")

    expect(await screen.findByText("Too many attempts. Try again in 2 min.")).toBeInTheDocument()
    expect(screen.queryByText("Enter the test code")).not.toBeInTheDocument()
  })

  test("a wrong confirmation code shows the attempts left and does not enable OTP", async () => {
    server.use(
      http.post(apiUrl("/v1/id/me/otp/enable/confirm"), () => problem(401, "auth/otp-invalid", { attempts_left: 2 })),
    )
    const onEnabled = mock(() => undefined)
    renderId(<OtpEnableForm user={userMe} onEnabled={onEnabled} />)

    await clickButton("Send test code")
    await fillField("Code", "000000")
    await clickButton("Turn on OTP login")

    expect(await screen.findByText("Wrong code. Attempts left: 2.")).toBeInTheDocument()
    expect(onEnabled).not.toHaveBeenCalled()
  })

  test("Change channels returns to the channel step", async () => {
    renderId(<OtpEnableForm user={userMe} onEnabled={() => undefined} />)

    await clickButton("Send test code")
    await clickButton("Change channels")

    expect(await screen.findByText("Turn on OTP login")).toBeInTheDocument()
    expect(await screen.findByRole("button", { name: "Send test code", hidden: true })).toBeInTheDocument()
  })
})

describe("OtpDisableForm", () => {
  test("sends the password and reports the user", async () => {
    let body = null as { password: string } | null
    server.use(
      http.post(apiUrl("/v1/id/me/otp/disable"), async ({ request }) => {
        body = (await request.json()) as { password: string }
        return HttpResponse.json({ ...userMe, otp_enabled: false })
      }),
    )
    const onDisabled = mock(() => undefined)
    renderId(<OtpDisableForm onDisabled={onDisabled} />)

    await fillField("Current password", "Secret123")
    await clickButton("Turn off OTP login")

    await waitFor(() => expect(onDisabled).toHaveBeenCalledTimes(1))
    expect(body).toEqual({ password: "Secret123" })
  })

  test("an empty password is not sent", async () => {
    let called = false
    server.use(
      http.post(apiUrl("/v1/id/me/otp/disable"), () => {
        called = true
        return HttpResponse.json(userMe)
      }),
    )
    const onDisabled = mock(() => undefined)
    renderId(<OtpDisableForm onDisabled={onDisabled} />)

    await clickButton("Turn off OTP login")

    expect(await screen.findByText("This field is required.")).toBeInTheDocument()
    expect(called).toBe(false)
    expect(onDisabled).not.toHaveBeenCalled()
  })

  test("a wrong password shows the error and does not report success", async () => {
    server.use(http.post(apiUrl("/v1/id/me/otp/disable"), () => problem(401, "auth/unauthorized")))
    const onDisabled = mock(() => undefined)
    renderId(<OtpDisableForm onDisabled={onDisabled} />)

    await fillField("Current password", "wrong")
    await clickButton("Turn off OTP login")

    expect(await screen.findByText("Wrong login or password.")).toBeInTheDocument()
    expect(onDisabled).not.toHaveBeenCalled()
  })
})
