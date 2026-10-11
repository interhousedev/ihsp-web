/** UF-ID-01 steps 2-3 and the EMIS credentials form, each on its own. */
import { describe, expect, mock, test } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { EmisCredentialsForm } from "../features/registration/components/emis-credentials-form"
import { RegisterCodeStep } from "../features/registration/components/register-code-step"
import { RegisterProfileStep } from "../features/registration/components/register-profile-step"
import { clickButton, fillField, renderId, allowSlowTests } from "./helpers"
import { problem } from "./problem"

allowSlowTests()

const start = {
  registration_token: "reg-token-1",
  profile: {
    first_name: "Aleksey",
    last_name: "Brastilov",
    middle_name: "Olegovich",
    group_name: "2TN2",
    login: "brastilov.aleksey",
  },
  imported_match: null,
}

describe("RegisterProfileStep", () => {
  test("shows the profile, sends the email and reports the password and email", async () => {
    let body = null as { registration_token: string; email: string } | null
    server.use(
      http.post(apiUrl("/v1/id/register/email"), async ({ request }) => {
        body = (await request.json()) as { registration_token: string; email: string }
        return new HttpResponse(null, { status: 202 })
      }),
    )
    const onSent = mock(() => undefined)
    renderId(<RegisterProfileStep start={start} onSent={onSent} />)

    expect(await screen.findByText("Brastilov Aleksey Olegovich")).toBeInTheDocument()
    expect(screen.getByText("2TN2")).toBeInTheDocument()
    await fillField("New password", "Secret123")
    await fillField("Repeat the password", "Secret123")
    await fillField("Recovery email", "aleksey@example.org")
    await clickButton("Send code to the email")

    await waitFor(() => expect(onSent).toHaveBeenCalledTimes(1))
    expect(body).toEqual({ registration_token: "reg-token-1", email: "aleksey@example.org" })
    expect((onSent.mock.calls[0] as unknown[])[0]).toMatchObject({
      password: "Secret123",
      email: "aleksey@example.org",
    })
  })

  test("mismatching passwords are not sent", async () => {
    let called = false
    server.use(
      http.post(apiUrl("/v1/id/register/email"), () => {
        called = true
        return new HttpResponse(null, { status: 202 })
      }),
    )
    const onSent = mock(() => undefined)
    renderId(<RegisterProfileStep start={start} onSent={onSent} />)

    await fillField("New password", "Secret123")
    await fillField("Repeat the password", "Different123")
    await fillField("Recovery email", "aleksey@example.org")
    await clickButton("Send code to the email")

    await waitFor(() => expect(screen.getAllByRole("alert", { hidden: true }).length).toBeGreaterThan(0))
    expect(called).toBe(false)
    expect(onSent).not.toHaveBeenCalled()
  })

  test("a rejected email shows the error and stays on the step", async () => {
    server.use(
      http.post(apiUrl("/v1/id/register/email"), () => problem(429, "common/rate-limited", { retry_after: 60 })),
    )
    const onSent = mock(() => undefined)
    renderId(<RegisterProfileStep start={start} onSent={onSent} />)

    await fillField("New password", "Secret123")
    await fillField("Repeat the password", "Secret123")
    await fillField("Recovery email", "aleksey@example.org")
    await clickButton("Send code to the email")

    expect(await screen.findByText("Too many attempts. Try again in 1 min.")).toBeInTheDocument()
    expect(onSent).not.toHaveBeenCalled()
  })
})

describe("RegisterCodeStep", () => {
  const props = {
    registrationToken: "reg-token-1",
    password: "Secret123",
    email: "aleksey@example.org",
    confirmImport: true,
    loginChallenge: "login-1",
  }

  test("completes the registration with the code, the confirmation and the login challenge", async () => {
    let body = null as Record<string, unknown> | null
    const response = { login: "brastilov.aleksey", redirect_to: null }
    server.use(
      http.post(apiUrl("/v1/id/register/complete"), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(response)
      }),
    )
    const onCompleted = mock(() => undefined)
    renderId(<RegisterCodeStep {...props} onBack={() => undefined} onCompleted={onCompleted} />)

    expect(await screen.findByText("We sent a 6-digit code to aleksey@example.org.")).toBeInTheDocument()
    await fillField("Code", "123456")
    await clickButton("Create account")

    await waitFor(() => expect(onCompleted).toHaveBeenCalledTimes(1))
    expect(body).toEqual({
      registration_token: "reg-token-1",
      password: "Secret123",
      email_code: "123456",
      confirm_import_match: true,
      login_challenge: "login-1",
    })
    expect((onCompleted.mock.calls[0] as unknown[])[0]).toEqual(response)
  })

  test("omits the confirmation and the challenge when there are none", async () => {
    let body = null as Record<string, unknown> | null
    server.use(
      http.post(apiUrl("/v1/id/register/complete"), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ login: "x", redirect_to: null })
      }),
    )
    const onCompleted = mock(() => undefined)
    renderId(
      <RegisterCodeStep
        {...props}
        confirmImport={false}
        loginChallenge={null}
        onBack={() => undefined}
        onCompleted={onCompleted}
      />,
    )

    await fillField("Code", "123456")
    await clickButton("Create account")

    await waitFor(() => expect(onCompleted).toHaveBeenCalled())
    expect(body).toEqual({ registration_token: "reg-token-1", password: "Secret123", email_code: "123456" })
  })

  test("a wrong code shows the error and does not complete", async () => {
    server.use(
      http.post(apiUrl("/v1/id/register/complete"), () => problem(401, "auth/otp-invalid", { attempts_left: 2 })),
    )
    const onCompleted = mock(() => undefined)
    renderId(<RegisterCodeStep {...props} onBack={() => undefined} onCompleted={onCompleted} />)

    await fillField("Code", "000000")
    await clickButton("Create account")

    expect(await screen.findByText("Wrong code. Attempts left: 2.")).toBeInTheDocument()
    expect(onCompleted).not.toHaveBeenCalled()
  })

  test("Change the email calls onBack", async () => {
    const onBack = mock(() => undefined)
    renderId(<RegisterCodeStep {...props} onBack={onBack} onCompleted={() => undefined} />)

    await clickButton("Change the email")

    expect(onBack).toHaveBeenCalledTimes(1)
  })
})

describe("EmisCredentialsForm", () => {
  const base = { title: "Register", description: "Enter EMIS data", submitLabel: "Continue", pending: false }

  test("submits the trimmed login and the password", async () => {
    const onSubmit = mock(() => undefined)
    renderId(<EmisCredentialsForm {...base} error={null} onSubmit={onSubmit} />)

    await fillField("EMIS login", "  student01 ")
    await fillField("EMIS password", "emis-secret")
    await clickButton("Continue")

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect((onSubmit.mock.calls[0] as unknown[])[0]).toEqual({ emis_login: "student01", emis_password: "emis-secret" })
  })

  test("empty fields are not submitted", async () => {
    const onSubmit = mock(() => undefined)
    renderId(<EmisCredentialsForm {...base} error={null} onSubmit={onSubmit} />)

    await clickButton("Continue")

    expect((await screen.findAllByText("This field is required.")).length).toBeGreaterThan(0)
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
